const sensors = {
    "Azure Kinect (Narrow FOV Mode)": {
        horizFov: 75,
        vertFov: 65,
        minRange: 0.5,
        maxRange: 5.5,
        datasheetURL: "https://drive.google.com/file/d/101ZrMqhjN50VapjEoFneZ7tHM0EPr0q1/view?usp=sharing",
    },
    "Azure Kinect (Wide FOV Mode)": {
        horizFov: 120,
        vertFov: 120,
        minRange: 0.25,
        maxRange: 2.9,
        datasheetURL: "https://drive.google.com/file/d/101ZrMqhjN50VapjEoFneZ7tHM0EPr0q1/view?usp=sharing",
    },
    "DreamVu PAL Mini": {
        horizFov: 360,
        vertFov: 89,
        vertFovOffsetInRad: 26.5,
        minRange: 0.0,
        maxRange: 3,
        datasheetURL: "https://dreamvu.com/pal-mini/",
    },
    "Intel RealSense D415": {
        horizFov: 65,
        vertFov: 40,
        minRange: 0.3,
        maxRange: 10,
        datasheetURL: "https://drive.google.com/file/d/1-bOINOA-kijfqd1aUATTIFRYcRsGa90r/view?usp=sharing",
    },
    "Intel RealSense D435/D435i": {
        horizFov: 87,
        vertFov: 58,
        minRange: 0.2,
        maxRange: 10,
        datasheetURL: "https://drive.google.com/file/d/1-ZXSOHQBdk8yI_chBm85vxqgHakghFbW/view?usp=sharing",
    },
    "Intel RealSense D455": {
        horizFov: 87,
        vertFov: 58,
        minRange: 0.6,
        maxRange: 10,
        datasheetURL: "https://drive.google.com/file/d/1-c_EUln7CoADydH5_FxlfvRG8J1owvxA/view?usp=sharing",
    },
    "Luxonis OAK-D": {
        horizFov: 72,
        vertFov: 49,
        minRange: 0.2,
        maxRange: 20,
        datasheetURL: "https://docs.luxonis.com/projects/hardware/en/latest/pages/BW1098OAK.html",
    },
    "Luxonis OAK-D S2": {
        horizFov: 72,
        vertFov: 49,
        minRange: 0.2,
        maxRange: 20,
        datasheetURL: "https://docs.luxonis.com/projects/hardware/en/latest/pages/DM9098s2.html",
    },

    "Mynt Eye D D1000-50": {
        horizFov: 64,
        vertFov: 38,
        minRange: 0.5,
        maxRange: 15,
        datasheetURL: "https://drive.google.com/file/d/1-edjzZCR7pUier3Uf7QjtbXagX5NMpAI/view?usp=sharing",
    },
    "Mynt Eye D D1000-120": {
        horizFov: 105,
        vertFov: 58,
        minRange: 0.3,
        maxRange: 10,
        datasheetURL: "https://drive.google.com/file/d/1-edjzZCR7pUier3Uf7QjtbXagX5NMpAI/view?usp=sharing",
    },
    "Mynt Eye D 1200": {
        horizFov: 59,
        vertFov: 35,
        minRange: 0.2,
        maxRange: 3,
        datasheetURL: "https://drive.google.com/file/d/1-edjzZCR7pUier3Uf7QjtbXagX5NMpAI/view?usp=sharing",
    },
    "Mynt Eye P": {
        horizFov: 75,
        vertFov: 40,
        minRange: 0.2,
        maxRange: 4.2,
        datasheetURL: "https://www.mynteye.com/pages/mynt-eye-p",
    },
    "Mynt Eye S S1030": {
        horizFov: 122,
        vertFov: 76,
        minRange: 0.5,
        maxRange: 18,
        datasheetURL: "https://drive.google.com/file/d/1-cmYihswL9CRheKI6HzBbxse_UuT0YQ9/view?usp=sharing",
    },
    "Mynt Eye S S2110": {
        horizFov: 95,
        vertFov: 50,
        minRange: 0.5,
        maxRange: 7,
        datasheetURL: "https://drive.google.com/file/d/1-cmYihswL9CRheKI6HzBbxse_UuT0YQ9/view?usp=sharing",
    },
    "Orbbec Astra": {
        horizFov: 60,
        vertFov: 49.5,
        minRange: 0.6,
        maxRange: 8,
        datasheetURL: "https://drive.google.com/file/d/10ChfvOM5g5dS-TBzr33K_xj7d-RopiP-/view?usp=sharing",
    },
    "Orbbec Astra +": {
        horizFov: 55,
        vertFov: 45,
        minRange: 0.6,
        maxRange: 8,
        datasheetURL: "https://shop.orbbec3d.com/Astra_Plus",
    },
    "Orbbec Astra Mini": {
        horizFov: 60,
        vertFov: 50,
        minRange: 0.6,
        maxRange: 5,
        datasheetURL: "https://shop.orbbec3d.com/Astra-Mini",
    },
    "Orbbec Astra Mini S": {
        horizFov: 60,
        vertFov: 50,
        minRange: 0.35,
        maxRange: 1,
        datasheetURL: "https://shop.orbbec3d.com/Astra-Mini-S",
    },
    "Orbbec Astra Persee": {
        horizFov: 60,
        vertFov: 49,
        minRange: 0.6,
        maxRange: 8,
        datasheetURL: "https://shop.orbbec3d.com/Orbbec-Persee",
    },
    "Orbbec Astra Pro": {
        horizFov: 60,
        vertFov: 50,
        minRange: 0.6,
        maxRange: 8,
        datasheetURL: "https://drive.google.com/file/d/106RS84xLJSDjbtaOmFiJZzVqvRUVIJ7Z/view?usp=sharing",
    },
    "Orbbec Astra S": {
        horizFov: 60,
        vertFov: 50,
        minRange: 0.4,
        maxRange: 2,
        datasheetURL: "https://drive.google.com/file/d/1027DTCxhq9ucfYNqX1vWfnVOpEaHV1FY/view?usp=sharing",
    },
    "Orbbec Astra Stereo S U3": {
        horizFov: 68,
        vertFov: 45,
        minRange: 0.25,
        maxRange: 2.5,
        datasheetURL: "https://shop.orbbec3d.com/Orbbec-Astra-Stereo-S-U3",
    },
    "pmd Pico Flexx": {
        horizFov: 62,
        vertFov: 45,
        minRange: 0.1,
        maxRange: 4,
        datasheetURL: "https://drive.google.com/file/d/10DPZLDbw92NvXpJ4EC4jGR3gq99wRI3M/view?usp=sharing",
    },
    "pmd Pico Monstar": {
        horizFov: 100,
        vertFov: 85,
        minRange: 0.5,
        maxRange: 6,
        datasheetURL: "https://drive.google.com/file/d/10HBbaPOB9kltjp-Fbb-sI1C7oVRA2Q7b/view?usp=sharing",
    },
    "StereoLabs Zed": {
        horizFov: 90,
        vertFov: 60,
        minRange: 0.3,
        maxRange: 25,
        datasheetURL: "https://drive.google.com/file/d/1-uMzIB_5QsJrt0Jb62DW2mzfCzbtLbwI/view?usp=sharing",
    },
    "StereoLabs Zed 2": {
        horizFov: 110,
        vertFov: 70,
        minRange: 0.2,
        maxRange: 20,
        datasheetURL: "https://drive.google.com/file/d/1-qJxrE4Whi2L2lEdeb_NtrWxAFI048X9/view?usp=sharing",
    },
    "StereoLabs Zed Mini": {
        horizFov: 90,
        vertFov: 60,
        minRange: 0.1,
        maxRange: 15,
        datasheetURL: "https://drive.google.com/file/d/1-wMaIl85fo16qqZn5ietgMOymi-QgE6n/view?usp=sharing",
    },
    "Structure Core Mono": {
        horizFov: 59,
        vertFov: 46,
        minRange: 0.3,
        maxRange: 10,
        datasheetURL: "https://structure.io/structure-core/specs",
    },
    "Structure Core RGB": {
        horizFov: 59,
        vertFov: 46,
        minRange: 0.3,
        maxRange: 10,
        datasheetURL: "https://structure.io/structure-core/specs",
    },
};

export { sensors };