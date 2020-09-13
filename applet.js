const Applet = imports.ui.applet;
const Main = imports.ui.main;
const St = imports.gi.St;
const GLib = imports.gi.GLib;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const PopupMenu = imports.ui.popupMenu;
const UUID = 'cpu_applet@keli5';

// Get output of shell command
function backtick(command) {
    try {
        let [result, stdout, stderr] = GLib.spawn_command_line_sync(command);
        if (stdout != null) {
            return stdout.toString();
        }
    }
    catch (e) {
        global.logError(e);
    }

    return "";
}


// I hate every bit of this
class CinnamonCPUApplet extends Applet.TextIconApplet {
    constructor(metadata, orientation, panel_height, instanceId) {
        super(orientation, panel_height, instanceId);
        this.menu = new Applet.AppletPopupMenu(this, orientation);
        let cpu_spd_line;
        let cpu_max_line;
        let cpu_min_line;
        this.set_applet_icon_name("chip");

        function get_lscpu_val(value, name) {
            return value.substring(name.length).trimLeft();
        } 

        function lscpu() {
            lscpu = backtick("lscpu");
            return lscpu.split("\n");
        }

        function ghz_or_mhz(value) {
            if (value > 1000) {
                value = (value / 1000).toFixed(2) + " GHz";
            } else {
                value = value.toFixed(0) + " MHz";
            }

            return value;
        }

        // pull max and min out
    
        function get_cpu_mm_speeds() {
            lscpu().some(function (el) {
                if (el.startsWith("CPU max MHz:")) {
                    cpu_max_line = Number(get_lscpu_val(el, "CPU max MHz:"));
                }
                else if (el.startsWith("CPU min MHz:")) {
                    cpu_min_line = Number(get_lscpu_val(el, "CPU min MHz:"));
                }
                if (cpu_min_line && cpu_max_line) {
                    return true
                }
            });

            return {
                "maxspeed": ghz_or_mhz(cpu_max_line),
                "minspeed": ghz_or_mhz(cpu_min_line)
            }

        }

        function get_cpu_speed() {

            lscpu().some(function (el) {
                if (el.startsWith("CPU MHz:")) {
                    cpu_spd_line = Number(get_lscpu_val(el, "CPU MHz:"));
                    return true;
                }
            });
            
            cpu_spd_line = ghz_or_mhz(cpu_spd_line)

            this.set_applet_label(cpu_spd_line)
            Mainloop.timeout_add_seconds(10, Lang.bind(this, get_cpu_speed));
        }
        Mainloop.timeout_add_seconds(10, Lang.bind(this, get_cpu_speed));
        // // // // // // // menu items
        let cpuspeeds = get_cpu_mm_speeds();
        let maxcs = new PopupMenu.PopupIconMenuItem(`Max speed ${cpuspeeds.maxspeed}`, "fast", St.IconType.FULLCOLOR);
        let mincs = new PopupMenu.PopupIconMenuItem(`Max speed ${cpuspeeds.minspeed}`, "slow", St.IconType.FULLCOLOR);
        this.menu.addMenuItem(maxcs);
        this.menu.addMenuItem(mincs);

    }
}

function main(metadata, orientation, panelHeight, instanceId) {
    let myApplet = new CinnamonCPUApplet(orientation, panelHeight, instanceId);
    return myApplet;
}