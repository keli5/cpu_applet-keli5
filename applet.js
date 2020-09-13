const Applet = imports.ui.applet;
const Main = imports.ui.main;
const GLib = imports.gi.GLib;
const Lang = imports.lang;
const Mainloop = imports.mainloop;

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
        let cpu_spd_line;
        this.set_applet_icon_name("chip");

        function lscpu() {
            let lscpu = backtick("lscpu");
            return lscpu.split("\n");
        }

        function get_cpu_speed() {
            
            lscpu().some(function (el) {
                if (el.startsWith("CPU MHz:")) {
                    cpu_spd_line = el;
                    return true;
                }
            });
            cpu_spd_line = cpu_spd_line.substring(8).trimLeft()
            cpu_spd_line = Number(cpu_spd_line)
            if (cpu_spd_line > 1000) {
                cpu_spd_line = (cpu_spd_line / 1000).toFixed(2) + " GHz"
            } else {
                cpu_spd_line = cpu_spd_line.toFixed(0) + " MHz"
            }

            this.set_applet_label(cpu_spd_line)
            Mainloop.timeout_add_seconds(10, Lang.bind(this, get_cpu_speed));
        }
        Mainloop.timeout_add_seconds(10, Lang.bind(this, get_cpu_speed));
        //////
        

    }
}

function main(metadata, orientation, panelHeight, instanceId) {
    let myApplet = new CinnamonCPUApplet(orientation, panelHeight, instanceId);
    return myApplet;
}