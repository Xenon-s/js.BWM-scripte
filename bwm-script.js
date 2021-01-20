// Script zum Schalten von Lampen per Bewegungsmelder (optional mit Helligkeitsabfrage)
const version = `version 0.2`;

/* Lampen 
die erste Zahl muss fortlaufend weitergeführt werden (wird später noch benötigt)
path: Hier wird der DP angegeben, der die Lampe schaltet
timer: timeout in sekunden
*/

let arrLights = {
    // Licht 1
    1: { path: 'hier den Pfad zum DP "switch" einfuegen', timer: 180},
    // Licht 2
    2: { path: '', timer: 180},
    // Licht 3
    3: { path: '', timer: 180},
};

/* Sensoren
die erste Zahl muss fortlaufend weitergeführt werden (wird später noch benötigt)
path: Hier wird der DP angegeben, der die Helligkeit (LUX) meldet
value: Helligkeitswert, der unterschritten werden muss, damit die Lampe eingeschaltet wird
*/
// Lichtsensor Flur
let arrSensors = {
    1: { path: 'hier den Pfad zum DP "lightlevel" einfuegen', value: 15 }
};

/* devices
bwm: Hier wird der DP angegeben, der beim Bewegungsmelder die Bewegung meldet
lights: einfach die Nummern der oben angelegten Lampen eintragen
sensors: einfach die Nummern der oben angelegten Lichtsensoren eintragen
*/

let arrDevices =
    [
        // BWM 1
        { bwm: 'hier den Pfad zum DP "motion" einfuegen', lights: [1], sensors: [1] },
        // BWM 
        { bwm: '', lights: [2], sensors: [1] },
        // BWM 
        { bwm: '', lights: [1, 2, 3], sensors: [] },
    ];

// Bei updates muss erst ab hier kopiert und eingefügt werden, somit braucht man seine Geräteliste nicht jedes mal neu erstellen

console.log(`Timerscript xenon-s ${version} gestartet`);

// Input pruefen
for (const i in arrLights) {
    if (!getObject(arrLights[i].path) || arrLights[i].timer == NaN) {
        console.warn(`BWM-Script: Folgendes Objekt ist fehlerhaft und wurde gelöscht: ${(JSON.stringify(arrLights[i].path))}`);
        delete arrLights[i];
    } else {
        arrLights[i].Timeout = null;
        arrLights[i].timer = (arrLights[i].timer * 1000);
    };
};

for (const i in arrSensors) {
    if (!getObject(arrSensors[i].path) || arrSensors[i].value == NaN) {
        console.warn(`BWM-Script: Folgendes Objekt ist fehlerhaft und wurde gelöscht: ${(JSON.stringify(arrSensors[i].path))}`);
        delete arrSensors[i];
    };
};

for (const i in arrDevices) {
    if (!getObject(arrDevices[i].bwm) || arrDevices[i].lights.length <= 0) {
        console.warn(`BWM-Script: Folgendes Objekt ist fehlerhaft und wurde gelöscht: ${(JSON.stringify(arrDevices[i].bwm))}`);
        delete arrDevices[i];
    };
};

createTrigger(arrDevices, arrSensors, arrLights);

async function createTrigger(arr, sensor, light) {
    arr.forEach(function async(objTemp) {
        console.debug(JSON.stringify(objTemp.bwm));
        on({ id: objTemp.bwm, change: "ne", ack: true }, function async(obj) {    // Trigger Licht an / aus
            // Lichtschalter AN/AUS 
            const val = getState(objTemp.bwm);
            let value = false;
            value = val.val;
            console.debug(`BWM:${JSON.stringify(objTemp)}, Wert: ${value}`);

            // Licht einschalten / timeout abbrechen
            for (const i in objTemp.lights) {
                console.debug(`CHANGE! timeout von ${objTemp.bwm} Wert: ${light[objTemp.lights[i]].Timeout}`);
                if (light[objTemp.lights[i]].Timeout != null) {
                    clearTimeout(light[objTemp.lights[i]].Timeout);
                    light[objTemp.lights[i]].Timeout = null;
                };
            };

            switch (value) {
                case true: {
                    if (objTemp.sensors.length >= 1) {
                        for (const i in objTemp.sensors) {
                            let luxVal = getState((sensor[objTemp.sensors[i]].path));
                            luxVal = luxVal.val;
                            if (luxVal <= sensor[objTemp.sensors[i]].value) {
                                console.debug(JSON.stringify(objTemp.lights));
                                setLight(objTemp, true, light);
                            };
                        };
                    } else {
                        setLight(objTemp, true, light);
                    };
                    break;
                };
                case false: {
                    // Licht ausschalten / timeout starten
                    for (const i in objTemp.lights) {
                        console.debug(`timeout ${light[objTemp.lights[i]].Timeout}`);
                        light[objTemp.lights[i]].Timeout = setTimeout(async () => {
                            setLight(objTemp, false, light);
                        }, light[objTemp.lights[i]].timer);
                    };
                    break;
                };
                default: {
                    console.warn(`Fehlerhafter Input bei obj: ${objTemp.motion}`);
                };
            };
        });
    });
};

async function setLight(objTemp, state, light) {
    console.debug(objTemp);
    console.debug(state);

    for (const i in objTemp.lights) {
        console.debug(light[objTemp.lights[i]].path);
        let val = getState(light[objTemp.lights[i]].path);
        val = val.val;
        if (val !== state) {
            console.debug(`Licht ${light[objTemp.lights[i]].path} wurde ${state}`);
            setState(light[objTemp.lights[i]].path, state);
        };
    };
};
