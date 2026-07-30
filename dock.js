// dock.js
// LAMBO CITY Luxury Marina Dock Core
// PHASE 1: Dock appearance upgrade
//
// Locked:
// - Same dock location
// - Same dock size
// - No water systems
// - No yacht systems
// - No HQ systems
//
// Upgrades:
// - premium wood materials
// - realistic dock planks
// - improved posts
// - luxury rail system
// - upgraded lantern foundation

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

let lanternLights = [];
let time = 0;


export default {

init(scene){


const DOCK_Y = 1.0;


// ================================
// MATERIALS
// ================================


const baseWood = new THREE.MeshStandardMaterial({
    color:0x5a351d,
    roughness:0.92
});


const plankWood = new THREE.MeshStandardMaterial({
    color:0x8a5732,
    roughness:0.85
});


const darkWood = new THREE.MeshStandardMaterial({
    color:0x3a2112,
    roughness:1
});


const metalRail = new THREE.MeshStandardMaterial({
    color:0x1b1b1b,
    metalness:0.75,
    roughness:0.35
});



// ================================
// MAIN DOCK PLATFORM
// ================================


const base = new THREE.Mesh(
    new THREE.BoxGeometry(
        14,
        0.45,
        100
    ),
    baseWood
);


base.position.set(
    0,
    DOCK_Y,
    -20
);


scene.add(base);



// ================================
// INDIVIDUAL DOCK PLANKS
// ================================


for(let z=-65; z<35; z+=2){


    const plank = new THREE.Mesh(
        new THREE.BoxGeometry(
            13.6,
            0.16,
            1.15
        ),
        plankWood
    );


    plank.position.set(
        0,
        DOCK_Y+0.28,
        z
    );


    scene.add(plank);


}




// ================================
// DOCK SUPPORT POSTS
// ================================


[-6,6].forEach(x=>{


for(let z=-65; z<35; z+=8){


const post = new THREE.Mesh(

    new THREE.CylinderGeometry(
        0.24,
        0.28,
        8,
        10
    ),

    darkWood

);


post.position.set(
    x,
    DOCK_Y-3.5,
    z
);


scene.add(post);


}


});




// ================================
// SIDE RAILINGS
// ================================


[-6.25,6.25].forEach(x=>{


const rail = new THREE.Mesh(

    new THREE.BoxGeometry(
        0.14,
        0.65,
        100
    ),

    metalRail

);


rail.position.set(
    x,
    DOCK_Y+0.65,
    -20
);


scene.add(rail);


});

// ================================
// LUXURY DOCK LANTERNS
// ================================


let index = 0;


for(let z=-60; z<30; z+=8){


    [-5.5,5.5].forEach(x=>{


        const pole = new THREE.Mesh(

            new THREE.CylinderGeometry(
                0.07,
                0.07,
                2.6,
                8
            ),

            new THREE.MeshStandardMaterial({

                color:0x171717,
                metalness:0.8,
                roughness:0.25

            })

        );


        pole.position.set(
            x,
            DOCK_Y+1.45,
            z
        );


        scene.add(pole);





        const lantern = new THREE.Mesh(

            new THREE.BoxGeometry(
                0.45,
                0.55,
                0.45
            ),

            new THREE.MeshStandardMaterial({

                color:0xffcc55,
                emissive:0xffaa22,
                emissiveIntensity:3

            })

        );


        lantern.position.set(
            x,
            DOCK_Y+2.9,
            z
        );


        scene.add(lantern);





        // REAL LIGHT (PERFORMANCE CONTROLLED)

        if(index % 3 === 0){


            const glow = new THREE.PointLight(
                0xffaa33,
                3.5,
                22
            );


            glow.position.set(
                x,
                DOCK_Y+2.9,
                z
            );


            scene.add(glow);


            lanternLights.push(glow);


        }


        index++;


    });


}






// ================================
// DOCK EDGE LUXURY LIGHTING STRIPS
// ================================


[-7.1,7.1].forEach(x=>{


const strip = new THREE.Mesh(

    new THREE.BoxGeometry(
        0.18,
        0.05,
        100
    ),

    new THREE.MeshStandardMaterial({

        color:0x9900ff,
        emissive:0x9900ff,
        emissiveIntensity:2.5

    })

);


strip.position.set(
    x,
    DOCK_Y+0.35,
    -20
);


scene.add(strip);


});






// ================================
// MOORING POSTS
// ================================


[-4.8,4.8].forEach(x=>{


for(let z=-55; z<30; z+=18){


const mooring = new THREE.Mesh(

    new THREE.CylinderGeometry(
        0.35,
        0.4,
        1.8,
        10
    ),

    new THREE.MeshStandardMaterial({

        color:0x24150b,
        roughness:0.95

    })

);


mooring.position.set(
    x,
    DOCK_Y+0.8,
    z
);


scene.add(mooring);



}



});






// ================================
// SMALL DOCK DETAIL BOXES
// ================================


for(let z=-50; z<30; z+=25){


const utilityBox = new THREE.Mesh(

    new THREE.BoxGeometry(
        0.7,
        0.8,
        0.5
    ),

    new THREE.MeshStandardMaterial({

        color:0x151515,
        metalness:0.5,
        roughness:0.5

    })

);


utilityBox.position.set(
    -5.2,
    DOCK_Y+0.45,
    z
);


scene.add(utilityBox);


}






},



update(delta){


time += delta;



lanternLights.forEach((light,i)=>{


light.intensity =
3.5 +
Math.sin(
time*1.8+i
)
*
0.5;


});


}


};  
