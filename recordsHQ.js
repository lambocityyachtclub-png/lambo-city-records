// recordsHQ.js
// LAMBO CITY RECORDS Headquarters VIP Marina Expansion
// HQ LOCATION LOCKED:
// x:28 z:22
//
// Added:
// - VIP red carpet arrival
// - luxury HQ exterior
// - marble VIP plaza
// - waterfront expansion (Part 2)
// - exclusive marina feeling

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";


const HQ_POSITION = {
  x:28,
  z:22
};



function createSignTexture(){

  const canvas=document.createElement("canvas");

  canvas.width=1024;
  canvas.height=512;


  const ctx=canvas.getContext("2d");


  ctx.fillStyle="#050505";
  ctx.fillRect(
    0,
    0,
    1024,
    512
  );


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



function createMarqueeTexture(){

  const canvas=document.createElement("canvas");

  canvas.width=1024;
  canvas.height=128;


  const ctx=canvas.getContext("2d");


  ctx.fillStyle="#000000";
  ctx.fillRect(
    0,
    0,
    1024,
    128
  );


  ctx.font="bold 42px Arial";
  ctx.textAlign="center";
  ctx.textBaseline="middle";

  ctx.fillStyle="#ffffff";


  ctx.fillText(
    "LAMBO CITY RECORDS — THE SOUND OF THE CITY",
    512,
    64
  );


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
      metalness:.7

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
      emissiveIntensity:.4,
      metalness:.8

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

      color:0x8b0018,
      roughness:.6

    })

  );


  parent.add(rope);

}







export default {


init(scene){


const group=new THREE.Group();


group.position.set(
  HQ_POSITION.x,
  0,
  HQ_POSITION.z
);




// ================================
// HQ BUILDING
// ================================


const building=new THREE.Mesh(

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




// GOLD BUILDING TRIM

[-9,9].forEach(x=>{


const trim=new THREE.Mesh(

 new THREE.BoxGeometry(
   .2,
   26,
   .2
 ),

 new THREE.MeshStandardMaterial({

  color:0xffd700,
  emissive:0xffd700,
  emissiveIntensity:1.5

 })

);


trim.position.set(
 x,
 13,
 7.05
);


group.add(trim);


});




// WINDOWS

for(let row=0; row<7; row++){

 for(let col=0; col<5; col++){


  if(Math.random()<.35) continue;


  const win=new THREE.Mesh(

   new THREE.BoxGeometry(
    1.4,
    1.6,
    .1
   ),

   new THREE.MeshStandardMaterial({

    color:0xffee88,
    emissive:0xffee88,
    emissiveIntensity:.7

   })

  );


  win.position.set(

   -7 + col*3.5,

   21-row*2.6,

   7.06

  );


  group.add(win);


 }

}






// ================================
// MAIN SIGN
// ================================


const signTex=new THREE.CanvasTexture(
 createSignTexture()
);


const sign=new THREE.Mesh(

 new THREE.PlaneGeometry(
 16,
 8
 ),

 new THREE.MeshStandardMaterial({

  map:signTex,
  emissiveMap:signTex,
  emissiveIntensity:1.4

 })

);


sign.position.set(
0,
22,
7.1
);


group.add(sign);




// ================================
// MARQUEE
// ================================


const marqueeTex=new THREE.CanvasTexture(
 createMarqueeTexture()
);


const marquee=new THREE.Mesh(

 new THREE.PlaneGeometry(
 14,
 1.5
 ),

 new THREE.MeshStandardMaterial({

  map:marqueeTex,
  emissiveMap:marqueeTex,
  emissiveIntensity:1.2

 })

);


marquee.position.set(
0,
16.5,
7.1
);


group.add(marquee);

// ================================
// LOBBY GLASS ENTRANCE
// ================================


const lobbyGlow = new THREE.Mesh(

 new THREE.BoxGeometry(
 10,
 6,
 .3
 ),

 new THREE.MeshStandardMaterial({

  color:0xfff4d0,
  emissive:0xffe8a0,
  emissiveIntensity:1,
  transparent:true,
  opacity:.55

 })

);


lobbyGlow.position.set(
0,
3,
7.2
);


group.add(lobbyGlow);




// GOLD LOBBY EMBLEM

const lobbyEmblem=new THREE.Mesh(

 new THREE.CircleGeometry(
 1.3,
 24
 ),

 new THREE.MeshStandardMaterial({

  color:0xffd700,
  emissive:0xffd700,
  emissiveIntensity:1.8

 })

);


lobbyEmblem.position.set(
0,
3.5,
6.9
);


group.add(lobbyEmblem);






// ================================
// RED CARPET VIP ARRIVAL
// ================================


const carpet=new THREE.Mesh(

 new THREE.PlaneGeometry(
 5,
 8
 ),

 new THREE.MeshStandardMaterial({

  color:0x8b0018,
  roughness:.7

 })

);


carpet.rotation.x=-Math.PI/2;


carpet.position.set(
0,
.03,
10.5
);


group.add(carpet);





// ================================
// VELVET ROPE ENTRANCE
// ================================


const ropeZ=[8.5,11.5];


[-2.5,2.5].forEach(x=>{


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







// ================================
// VIP MARBLE PLAZA
// ================================


const plaza=new THREE.Mesh(

 new THREE.BoxGeometry(
 22,
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


group.add(plaza);




// GOLD MARBLE LINES

[-8,-4,0,4,8].forEach(x=>{


const line=new THREE.Mesh(

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


line.position.set(

 HQ_POSITION.x+x,

 .09,

 HQ_POSITION.z+10

);


group.add(line);


});








// ================================
// WATERFRONT VIP LOUNGE
// ================================


const loungeFloor=new THREE.Mesh(

 new THREE.BoxGeometry(
 14,
 .15,
 12
 ),

 new THREE.MeshStandardMaterial({

  color:0x161616,
  roughness:.35,
  metalness:.4

 })

);


loungeFloor.position.set(

 HQ_POSITION.x+14,

 .08,

 HQ_POSITION.z+8

);


group.add(loungeFloor);





const seatMat=new THREE.MeshStandardMaterial({

color:0x050505,
roughness:.4,
metalness:.3

});



[
 [-5,-3],
 [5,-3],
 [-5,3],
 [5,3]

].forEach(pos=>{


const seat=new THREE.Mesh(

 new THREE.BoxGeometry(
 2,
 .7,
 2
 ),

 seatMat

);


seat.position.set(

 HQ_POSITION.x+14+pos[0],

 .45,

 HQ_POSITION.z+8+pos[1]

);


group.add(seat);


});





// VIP TABLE

const table=new THREE.Mesh(

 new THREE.CylinderGeometry(
 1.2,
 1.2,
 .15,
 24
 ),

 new THREE.MeshStandardMaterial({

  color:0x111111,
  metalness:.8,
  roughness:.2

 })

);


table.position.set(

 HQ_POSITION.x+14,

 .7,

 HQ_POSITION.z+8

);


group.add(table);






// ================================
// PRIVATE PIER WATER VIEW
// ================================


const waterDeck=new THREE.Mesh(

 new THREE.BoxGeometry(
 28,
 .15,
 20
 ),

 new THREE.MeshStandardMaterial({

  color:0x081522,
  roughness:.2,
  metalness:.3

 })

);


waterDeck.position.set(

 HQ_POSITION.x+14,

 .05,

 HQ_POSITION.z+22

);


group.add(waterDeck);




// WATER REFLECTION LINES

[-5,0,5].forEach(x=>{


const reflection=new THREE.Mesh(

 new THREE.BoxGeometry(
 22,
 .03,
 .15
 ),

 new THREE.MeshStandardMaterial({

  color:0x00ffff,
  emissive:0x00ffff,
  emissiveIntensity:1.5

 })

);


reflection.position.set(

 HQ_POSITION.x+14+x,

 .15,

 HQ_POSITION.z+22

);


group.add(reflection);


});








// ================================
// HQ ROUNDABOUT TURNAROUND
// ================================


const roundabout=new THREE.Mesh(

 new THREE.CylinderGeometry(
 8,
 8,
 .15,
 48
 ),

 new THREE.MeshStandardMaterial({

  color:0x111111,
  roughness:.8

 })

);


roundabout.position.set(

 HQ_POSITION.x+2,

 .1,

 HQ_POSITION.z-24

);


group.add(roundabout);





const ring=new THREE.Mesh(

 new THREE.TorusGeometry(
 5,
 .12,
 12,
 48
 ),

 new THREE.MeshStandardMaterial({

  color:0xffd700,
  emissive:0xffd700,
  emissiveIntensity:1.5

 })

);


ring.rotation.x=Math.PI/2;


ring.position.set(

 HQ_POSITION.x+2,

 .25,

 HQ_POSITION.z-24

);


group.add(ring);







// ================================
// VIP STREET CONTROL
// Stops vehicles from parking directly
// in front of HQ
// ================================


const barrier=new THREE.Mesh(

 new THREE.BoxGeometry(
 18,
 .6,
 1
 ),

 new THREE.MeshStandardMaterial({

  color:0x220000,
  roughness:.5

 })

);


barrier.position.set(

 HQ_POSITION.x,

 .3,

 HQ_POSITION.z+15

);


group.add(barrier);






// FINAL ADD

scene.add(group);


},


update(){}


};  
