// recordsHQ.js
// LAMBO CITY RECORDS Headquarters VIP Marina Expansion
// HQ LOCATION LOCKED:
// x:28 z:22
//
// Added:
// - VIP red carpet arrival plaza
// - luxury marble entrance
// - waterfront lounge
// - private pier feeling
// - exclusive roundabout area

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";


const HQ_POSITION = { x: 28, z: 22 };


function createSignTexture(){

  const canvas = document.createElement("canvas");

  canvas.width = 1024;
  canvas.height = 512;

  const ctx = canvas.getContext("2d");


  ctx.fillStyle="#050505";
  ctx.fillRect(0,0,1024,512);


  ctx.textAlign="center";
  ctx.textBaseline="middle";


  ctx.font="bold 110px Arial";

  ctx.shadowColor="#ff00aa";
  ctx.shadowBlur=30;

  ctx.fillStyle="#ffd700";

  ctx.fillText(
    "LAMBO CITY",
    512,
    280
  );


  ctx.font="bold 90px Arial";

  ctx.fillText(
    "RECORDS",
    512,
    400
  );


  ctx.shadowBlur=0;


  return canvas;

}



function buildStanchion(x,z){

  const group=new THREE.Group();


  const base=new THREE.Mesh(

    new THREE.CylinderGeometry(
      .32,
      .38,
      .14,
      12
    ),

    new THREE.MeshStandardMaterial({

      color:0x111111,
      metalness:.6

    })

  );


  base.position.y=.07;

  group.add(base);



  const pole=new THREE.Mesh(

    new THREE.CylinderGeometry(
      .07,
      .07,
      1.1,
      10
    ),

    new THREE.MeshStandardMaterial({

      color:0xffd700,
      emissive:0xffd700,
      emissiveIntensity:.4

    })

  );


  pole.position.y=.65;

  group.add(pole);



  const top=new THREE.Mesh(

    new THREE.SphereGeometry(
      .13,
      12,
      12
    ),

    new THREE.MeshStandardMaterial({

      color:0xffd700,
      emissive:0xffd700,
      emissiveIntensity:.5

    })

  );


  top.position.y=1.25;

  group.add(top);


  group.position.set(
    x,
    0,
    z
  );


  return group;

}



function buildRope(x1,z1,x2,z2,parent){


  const curve=new THREE.CatmullRomCurve3([

    new THREE.Vector3(
      x1,
      1.2,
      z1
    ),

    new THREE.Vector3(
      (x1+x2)/2,
      .8,
      (z1+z2)/2
    ),

    new THREE.Vector3(
      x2,
      1.2,
      z2
    )

  ]);



  const rope=new THREE.Mesh(

    new THREE.TubeGeometry(
      curve,
      12,
      .055,
      6,
      false
    ),

    new THREE.MeshStandardMaterial({

      color:0x8b0018

    })

  );


  parent.add(rope);

}




function buildVIPPlaza(scene){


  const plaza=new THREE.Mesh(

    new THREE.BoxGeometry(
      20,
      .08,
      18
    ),

    new THREE.MeshStandardMaterial({

      color:0xe9e4d8,
      roughness:.25,
      metalness:.2

    })

  );


  plaza.position.set(

    HQ_POSITION.x,

    .04,

    HQ_POSITION.z+10

  );


  scene.add(plaza);



  [-8,-4,0,4,8].forEach(x=>{


    const goldLine=new THREE.Mesh(

      new THREE.BoxGeometry(
        .05,
        .09,
        18
      ),

      new THREE.MeshStandardMaterial({

        color:0xffd700,
        emissive:0xffd700,
        emissiveIntensity:1

      })

    );


    goldLine.position.set(

      HQ_POSITION.x+x,

      .08,

      HQ_POSITION.z+10

    );


    scene.add(goldLine);


  });


}

    // =========================================================
    // WATERFRONT VIP LOUNGE AREA
    // =========================================================

    const lounge = new THREE.Group();

    const loungeFloor = new THREE.Mesh(
      new THREE.BoxGeometry(14,0.15,12),
      new THREE.MeshStandardMaterial({
        color:0x161616,
        roughness:0.35,
        metalness:0.4
      })
    );

    loungeFloor.position.set(16,0.08,8);
    group.add(loungeFloor);


    // Luxury seating
    const seatMat = new THREE.MeshStandardMaterial({
      color:0x050505,
      roughness:0.4,
      metalness:0.3
    });


    [
      [13,5],
      [19,5],
      [13,10],
      [19,10]
    ].forEach(pos=>{

      const chair = new THREE.Mesh(
        new THREE.BoxGeometry(2,0.7,2),
        seatMat
      );

      chair.position.set(pos[0],0.45,pos[1]);
      group.add(chair);

    });


    // Center VIP table

    const table = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2,1.2,0.15,24),
      new THREE.MeshStandardMaterial({
        color:0x111111,
        metalness:0.8,
        roughness:0.2
      })
    );

    table.position.set(16,0.7,7.5);
    group.add(table);



    // Ocean railing

    const railing = new THREE.Mesh(
      new THREE.BoxGeometry(18,1,0.15),
      new THREE.MeshStandardMaterial({
        color:0xd4af37,
        metalness:0.8,
        roughness:0.2
      })
    );

    railing.position.set(16,0.8,14);
    group.add(railing);



    // =========================================================
    // WATER VIEW AREA
    // =========================================================

    const waterDeck = new THREE.Mesh(
      new THREE.BoxGeometry(26,0.15,18),
      new THREE.MeshStandardMaterial({
        color:0x081522,
        roughness:0.2,
        metalness:0.3
      })
    );

    waterDeck.position.set(16,0.05,22);
    group.add(waterDeck);



    // Fake water reflection strips

    [-4,0,4].forEach(x=>{

      const reflection = new THREE.Mesh(
        new THREE.BoxGeometry(20,0.03,0.15),
        new THREE.MeshStandardMaterial({
          color:0x00ffff,
          emissive:0x00ffff,
          emissiveIntensity:1.5
        })
      );

      reflection.position.set(16+x,0.15,22);
      group.add(reflection);

    });



    // =========================================================
    // HQ ROUNDABOUT TURNAROUND
    // =========================================================


    const roundabout = new THREE.Mesh(
      new THREE.CylinderGeometry(8,8,0.15,48),
      new THREE.MeshStandardMaterial({
        color:0x111111,
        roughness:0.8
      })
    );

    roundabout.position.set(18,0.1,-2);
    group.add(roundabout);



    const centerRing = new THREE.Mesh(
      new THREE.TorusGeometry(5,0.12,12,48),
      new THREE.MeshStandardMaterial({
        color:0xffd700,
        emissive:0xffd700,
        emissiveIntensity:1.5
      })
    );

    centerRing.rotation.x=Math.PI/2;
    centerRing.position.set(18,0.25,-2);
    group.add(centerRing);



    // =========================================================
    // VIP STREET BLOCKER
    // Prevents cars pulling directly in front of HQ
    // =========================================================


    const streetBarrier = new THREE.Mesh(
      new THREE.BoxGeometry(18,0.6,1),
      new THREE.MeshStandardMaterial({
        color:0x220000,
        roughness:0.5
      })
    );


    streetBarrier.position.set(0,-0.2,15);
    group.add(streetBarrier);



    // Gold VIP entrance markers

    [-6,6].forEach(x=>{

      const marker = new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.25,
          0.25,
          1.2,
          16
        ),
        new THREE.MeshStandardMaterial({
          color:0xffd700,
          emissive:0xffd700,
          emissiveIntensity:1.2
        })
      );

      marker.position.set(x,0.6,15);
      group.add(marker);

    });



    scene.add(group);

  },

  update(){}

};
