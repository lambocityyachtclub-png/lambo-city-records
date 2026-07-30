// recordsHQ.js
// LAMBO CITY RECORDS Headquarters VIP Marina Expansion
// Keeps original HQ position:
// const HQ_POSITION = { x: 28, z: 22 };
//
// Added:
// - VIP red carpet plaza
// - luxury marble arrival zone
// - permanent lime Lamborghini display
// - waterfront lounge
// - pier viewing area
// - exclusive roundabout turnaround

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const HQ_POSITION = { x: 28, z: 22 };

function createSignTexture() {
  const w = 1024, h = 512;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#050505";
  ctx.fillRect(0,0,w,h);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.font = "bold 110px Arial";
  ctx.shadowColor = "#ff00aa";
  ctx.shadowBlur = 30;
  ctx.fillStyle = "#ffd700";
  ctx.fillText("LAMBO CITY", w/2, 280);

  ctx.font = "bold 90px Arial";
  ctx.fillText("RECORDS", w/2, 400);

  ctx.shadowBlur = 0;

  return canvas;
}


function createMarqueeTexture() {

  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 128;

  const ctx = canvas.getContext("2d");

  ctx.fillStyle="#000";
  ctx.fillRect(0,0,1024,128);

  ctx.fillStyle="#fff";
  ctx.font="bold 42px Arial";
  ctx.textAlign="center";
  ctx.textBaseline="middle";

  ctx.fillText(
    "LAMBO CITY RECORDS — THE SOUND OF THE CITY",
    512,
    64
  );

  return canvas;
}


function buildStanchion(x,z){

  const g = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(.32,.38,.14,12),
    new THREE.MeshStandardMaterial({
      color:0x111111,
      metalness:.6
    })
  );

  base.position.y=.07;
  g.add(base);


  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(.07,.07,1.1,10),
    new THREE.MeshStandardMaterial({
      color:0xffd700,
      emissive:0xffd700,
      emissiveIntensity:.4
    })
  );

  pole.position.y=.65;
  g.add(pole);


  const top = new THREE.Mesh(
    new THREE.SphereGeometry(.13,12,12),
    new THREE.MeshStandardMaterial({
      color:0xffd700,
      emissive:0xffd700,
      emissiveIntensity:.5
    })
  );

  top.position.y=1.25;
  g.add(top);


  g.position.set(x,0,z);

  return g;
}


function buildRope(x1,z1,x2,z2,parent){

  const curve = new THREE.CatmullRomCurve3([

    new THREE.Vector3(x1,1.2,z1),

    new THREE.Vector3(
      (x1+x2)/2,
      .8,
      (z1+z2)/2
    ),

    new THREE.Vector3(x2,1.2,z2)

  ]);


  const rope = new THREE.Mesh(

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


// VIP MARBLE PLAZA

function buildVIPPlaza(scene){

  const plaza = new THREE.Mesh(

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
    HQ_POSITION.z + 10
  );


  scene.add(plaza);



  [-8,-4,0,4,8].forEach(x=>{

    const goldLine = new THREE.Mesh(

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
function buildDisplayLamborghini(scene){

  const car = new THREE.Group();


  // DISPLAY PLATFORM

  const platform = new THREE.Mesh(

    new THREE.BoxGeometry(
      6,
      .25,
      3.5
    ),

    new THREE.MeshStandardMaterial({

      color:0x111111,
      metalness:.6,
      roughness:.3

    })

  );

  platform.position.y=.15;
  car.add(platform);



  const platformGlow = new THREE.Mesh(

    new THREE.BoxGeometry(
      6.2,
      .05,
      3.7
    ),

    new THREE.MeshStandardMaterial({

      color:0xffd700,
      emissive:0xffd700,
      emissiveIntensity:1.5

    })

  );


  platformGlow.position.y=.3;
  car.add(platformGlow);



  // EARLY LAMBORGHINI INSPIRED SILHOUETTE

  const green = new THREE.MeshStandardMaterial({

    color:0x9dff00,
    metalness:.7,
    roughness:.2

  });



  const body = new THREE.Mesh(

    new THREE.BoxGeometry(
      4.5,
      .7,
      1.8
    ),

    green

  );

  body.position.y=.8;
  car.add(body);



  const cabin = new THREE.Mesh(

    new THREE.BoxGeometry(
      2,
      .65,
      1.4
    ),

    green

  );


  cabin.position.set(
    -.4,
    1.35,
    0
  );


  car.add(cabin);



  const wheelMat = new THREE.MeshStandardMaterial({

    color:0x050505

  });


  [

    [1.4,.9],
    [1.4,-.9],
    [-1.4,.9],
    [-1.4,-.9]

  ].forEach(([x,z])=>{


    const wheel = new THREE.Mesh(

      new THREE.CylinderGeometry(
        .35,
        .35,
        .3,
        12
      ),

      wheelMat

    );


    wheel.rotation.z=Math.PI/2;

    wheel.position.set(
      x,
      .45,
      z
    );


    car.add(wheel);

  });



  car.position.set(

    HQ_POSITION.x,
    0,
    HQ_POSITION.z+7

  );


  car.rotation.y=Math.PI/2;


  scene.add(car);

}




// WATERFRONT VIP LOUNGE

function buildWaterfrontLounge(scene){

  const lounge = new THREE.Group();



  const seatMat = new THREE.MeshStandardMaterial({

    color:0x161616,
    roughness:.5

  });



  [

    [-2,-2],
    [2,-2],
    [-2,2],
    [2,2]

  ].forEach(([x,z])=>{


    const seat = new THREE.Mesh(

      new THREE.BoxGeometry(
        1.5,
        .6,
        1.5
      ),

      seatMat

    );


    seat.position.set(
      x,
      .3,
      z
    );


    lounge.add(seat);


  });



  const table = new THREE.Mesh(

    new THREE.CylinderGeometry(
      1,
      1,
      .15,
      20
    ),

    new THREE.MeshStandardMaterial({

      color:0x080808,
      metalness:.8

    })

  );


  table.position.y=.55;

  lounge.add(table);



  const waterRail = new THREE.Mesh(

    new THREE.BoxGeometry(
      10,
      .8,
      .1
    ),

    new THREE.MeshStandardMaterial({

      color:0xcccccc,
      metalness:.8

    })

  );


  waterRail.position.set(
    0,
    .5,
    5
  );


  lounge.add(waterRail);



  lounge.position.set(

    HQ_POSITION.x+12,
    0,
    HQ_POSITION.z+5

  );


  scene.add(lounge);

}




// PRIVATE ROUNDABOUT TURNAROUND

function buildHQRoundabout(scene){


  const circle = new THREE.Mesh(

    new THREE.CylinderGeometry(
      8,
      8,
      .12,
      48
    ),

    new THREE.MeshStandardMaterial({

      color:0x222222,
      roughness:.8

    })

  );


  circle.position.set(

    HQ_POSITION.x+10,
    .06,
    HQ_POSITION.z+15

  );


  scene.add(circle);



  const center = new THREE.Mesh(

    new THREE.CylinderGeometry(
      2,
      2,
      .2,
      32
    ),

    new THREE.MeshStandardMaterial({

      color:0xffd700,
      emissive:0xffd700,
      emissiveIntensity:1

    })

  );


  center.position.set(

    HQ_POSITION.x+10,
    .15,
    HQ_POSITION.z+15

  );


  scene.add(center);

}




export default {

  init(scene){


    const group = new THREE.Group();

    group.position.set(
      HQ_POSITION.x,
      0,
      HQ_POSITION.z
    );



    const building = new THREE.Mesh(

      new THREE.BoxGeometry(
        18,
        26,
        14
      ),

      new THREE.MeshStandardMaterial({

        color:0x0a0a0f,
        roughness:.5,
        metalness:.3

      })

    );


    building.position.y=13;

    group.add(building);



    const sign = new THREE.Mesh(

      new THREE.PlaneGeometry(
        16,
        8
      ),

      new THREE.MeshStandardMaterial({

        map:new THREE.CanvasTexture(
          createSignTexture()
        ),

        emissive:0xffffff,
        emissiveIntensity:1.4

      })

    );


    sign.position.set(
      0,
      22,
      7.1
    );


    group.add(sign);



    const carpet = new THREE.Mesh(

      new THREE.PlaneGeometry(
        4,
        6
      ),

      new THREE.MeshStandardMaterial({

        color:0x8b0018

      })

    );


    carpet.rotation.x=-Math.PI/2;


    carpet.position.set(

      0,
      .03,
      10

    );


    group.add(carpet);



    const ropeZ=[9,12];


    [-2.2,2.2].forEach(x=>{


      ropeZ.forEach(z=>{

        group.add(
          buildStanchion(x,z)
        );

      });


      buildRope(
        x,
        ropeZ[0],
        x,
        ropeZ[1],
        group
      );


    });



    scene.add(group);



    // NEW VIP EXPANSIONS

    buildVIPPlaza(scene);

    buildDisplayLamborghini(scene);

    buildWaterfrontLounge(scene);

    buildHQRoundabout(scene);


  },


  update(){}

};
