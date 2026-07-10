import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
export default {
  init(scene) {
    // MARINA GROUND — warm brown
    const gm = new THREE.MeshStandardMaterial({ color:0x3a2010, roughness:1 });
    const lg = new THREE.Mesh(new THREE.BoxGeometry(44,0.5,130), gm);
    lg.position.set(-43,0.4,-20); scene.add(lg);
    const rg = new THREE.Mesh(new THREE.BoxGeometry(44,0.5,130), gm);
    rg.position.set(43,0.4,-20); scene.add(rg);

    // STAGE GROUND
    const sg = new THREE.Mesh(
      new THREE.BoxGeometry(130,0.5,55),
      new THREE.MeshStandardMaterial({color:0x0a0a14,roughness:1})
    );
    sg.position.set(0,0.4,-72); scene.add(sg);

    // STAGE PLATFORM
    const stage = new THREE.Mesh(
      new THREE.BoxGeometry(34,1.4,18),
      new THREE.MeshStandardMaterial({color:0x0d0d0d,roughness:0.5})
    );
    stage.position.set(0,1.1,-74); scene.add(stage);

    // STAGE BACK WALL
    const bw = new THREE.Mesh(
      new THREE.BoxGeometry(34,22,1.2),
      new THREE.MeshStandardMaterial({color:0x060606})
    );
    bw.position.set(0,11,-83.5); scene.add(bw);

    // LED SCREEN — bright purple
    const screen = new THREE.Mesh(
      new THREE.BoxGeometry(28,14,0.4),
      new THREE.MeshStandardMaterial({
        color:0x9900ff, emissive:0x9900ff, emissiveIntensity:2.0
      })
    );
    screen.name = "stageScreenOuter";
    screen.position.set(0,12,-83); scene.add(screen);

    // SCREEN INNER — brighter center
    const screenC = new THREE.Mesh(
      new THREE.BoxGeometry(22,10,0.5),
      new THREE.MeshStandardMaterial({
        color:0xcc44ff, emissive:0xcc44ff, emissiveIntensity:1.5
      })
    );
    screenC.name = "stageScreenInner";
    screenC.position.set(0,12,-82.8); scene.add(screenC);

    // GOLD SIGN
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(24,2.5,0.4),
      new THREE.MeshStandardMaterial({
        color:0xffd700, emissive:0xffd700, emissiveIntensity:2.5
      })
    );
    sign.position.set(0,19.5,-82.8); scene.add(sign);

    // THE TAKEOVER text bar
    const tb = new THREE.Mesh(
      new THREE.BoxGeometry(16,1.2,0.4),
      new THREE.MeshStandardMaterial({
        color:0xffffff, emissive:0xffffff, emissiveIntensity:0.6
      })
    );
    tb.position.set(0,17.5,-82.8); scene.add(tb);

    // STAGE TOWERS
    [-17,17].forEach(x => {
      const t = new THREE.Mesh(
        new THREE.BoxGeometry(2.5,26,2.5),
        new THREE.MeshStandardMaterial({color:0x080808,metalness:0.7})
      );
      t.position.set(x,13,-83); scene.add(t);

      // Tower neon strips
      [8,14,20].forEach(y => {
        const strip = new THREE.Mesh(
          new THREE.BoxGeometry(0.15,0.15,2.5),
          new THREE.MeshStandardMaterial({color:0x9900ff,emissive:0x9900ff,emissiveIntensity:2})
        );
        strip.position.set(x,y,-83); scene.add(strip);
      });

      const tl = new THREE.PointLight(0xff00ff,3,25);
      tl.position.set(x,24,-80); scene.add(tl);
    });

    // STAGE STAIRS
    for (let i = 0; i < 6; i++) {
      const s = new THREE.Mesh(
        new THREE.BoxGeometry(16,0.3,1.5),
        new THREE.MeshStandardMaterial({color:0x111111})
      );
      s.position.set(0, 0.8+i*0.22, -65.5-i*1.5); scene.add(s);
    }

    // VILLAS — left side, upgraded
    [{z:8},{z:-16},{z:-40}].forEach(vp => {
      const x = -37;

      // MAIN VILLA — warm wood
      const v = new THREE.Mesh(
        new THREE.BoxGeometry(20,10,16),
        new THREE.MeshStandardMaterial({color:0x5a3520,roughness:0.85})
      );
      v.position.set(x,5.7,vp.z); scene.add(v);

      // ROOF OVERHANG
      const roof = new THREE.Mesh(
        new THREE.BoxGeometry(22,0.6,18),
        new THREE.MeshStandardMaterial({color:0x3a2010,roughness:1})
      );
      roof.position.set(x,11,vp.z); scene.add(roof);

      // SECOND FLOOR BALCONY
      const bal = new THREE.Mesh(
        new THREE.BoxGeometry(18,0.3,3.5),
        new THREE.MeshStandardMaterial({color:0x6a4530,roughness:0.9})
      );
      bal.position.set(x,7,vp.z+8.5); scene.add(bal);

      // BALCONY RAILING
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(18,0.8,0.15),
        new THREE.MeshStandardMaterial({color:0x888888,metalness:0.6})
      );
      rail.position.set(x,7.6,vp.z+10.3); scene.add(rail);

      // WINDOWS — ground floor
      for (let col = 0; col < 4; col++) {
        const wg = new THREE.Mesh(
          new THREE.BoxGeometry(2.8,2.5,0.1),
          new THREE.MeshStandardMaterial({
            color:0xffcc66, emissive:0xffaa33,
            emissiveIntensity:1.0, transparent:true, opacity:0.9
          })
        );
        wg.position.set(x-7+col*4.5, 3.5, vp.z+8.1); scene.add(wg);
      }

      // WINDOWS — second floor
      for (let col = 0; col < 3; col++) {
        const w2 = new THREE.Mesh(
          new THREE.BoxGeometry(2.5,2,0.1),
          new THREE.MeshStandardMaterial({
            color:0xffcc66, emissive:0xffaa33,
            emissiveIntensity:0.8, transparent:true, opacity:0.9
          })
        );
        w2.position.set(x-5+col*5, 7.5, vp.z+8.1); scene.add(w2);
      }

      // POOL — teal glow
      const pool = new THREE.Mesh(
        new THREE.BoxGeometry(14,0.2,6),
        new THREE.MeshStandardMaterial({
          color:0x00aacc, emissive:0x00aacc,
          emissiveIntensity:1.0, transparent:true, opacity:0.9
        })
      );
      pool.position.set(x,0.8,vp.z+14); scene.add(pool);

      // POOL NEON EDGE
      ['#9900ff','#00aacc'].forEach((color, ci) => {
        const edge = new THREE.Mesh(
          new THREE.BoxGeometry(14,0.12,0.12),
          new THREE.MeshStandardMaterial({
            color:parseInt(color.replace('#','0x')),
            emissive:parseInt(color.replace('#','0x')),
            emissiveIntensity:2.5
          })
        );
        edge.position.set(x, 0.9, vp.z+11+ci*6); scene.add(edge);
      });

      // VILLA LIGHTS
      const vl = new THREE.PointLight(0xffaa44,4,24);
      vl.position.set(x,5,vp.z+6); scene.add(vl);
      const pl = new THREE.PointLight(0x00ccff,3,18);
      pl.position.set(x,1.5,vp.z+14); scene.add(pl);
    });

    // BACKGROUND SKYLINE — taller, more detailed
    [
      {x:-68,z:-48,w:14,h:26,c:0x1a1a3e},
      {x:-85,z:-68,w:11,h:38,c:0x0d0d2b},
      {x:-102,z:-55,w:9, h:22,c:0x111130},
      {x:68, z:-48,w:14,h:24,c:0x1a1a3e},
      {x:85, z:-68,w:11,h:34,c:0x0d0d2b},
      {x:102,z:-55,w:9, h:28,c:0x111130},
      {x:0,  z:-100,w:22,h:28,c:0x0a0820},
      {x:-40,z:-90,w:12,h:20,c:0x120d2b},
      {x:40, z:-90,w:12,h:20,c:0x120d2b},
    ].forEach(b => {
      const bl = new THREE.Mesh(
        new THREE.BoxGeometry(b.w,b.h,12),
        new THREE.MeshStandardMaterial({color:b.c,roughness:0.7,metalness:0.2})
      );
      bl.position.set(b.x,b.h/2,b.z); scene.add(bl);

      // WINDOWS
      for (let row=0; row<5; row++) for (let col=0; col<3; col++) {
        if (Math.random()<0.3) continue;
        const w = new THREE.Mesh(
          new THREE.BoxGeometry(1.4,1.0,0.1),
          new THREE.MeshStandardMaterial({
            color:0xffee88, emissive:0xffee88,
            emissiveIntensity:Math.random()*0.6+0.4
          })
        );
        w.position.set(b.x-b.w/2+2+col*4, 3+row*4, b.z+6.1); scene.add(w);
      }

      // ROOFTOP NEON
      const rn = new THREE.Mesh(
        new THREE.BoxGeometry(b.w+1,0.2,0.2),
        new THREE.MeshStandardMaterial({
          color:0x9900ff, emissive:0x9900ff, emissiveIntensity:2.5
        })
      );
      rn.position.set(b.x,b.h+0.2,b.z+6); scene.add(rn);

      // ROOFTOP LIGHT
      const rl = new THREE.PointLight(0x9900ff,1.5,25);
      rl.position.set(b.x,b.h+2,b.z+6); scene.add(rl);
    });

    // NEON DOCK EDGE STRIPS
    [-7,7].forEach(x => {
      const s = new THREE.Mesh(
        new THREE.BoxGeometry(0.2,0.06,100),
        new THREE.MeshStandardMaterial({
          color:0x9900ff, emissive:0x9900ff, emissiveIntensity:2
        })
      );
      s.position.set(x,1.3,-20); scene.add(s);
    });

    // STAGE NEON FLOOR STRIPS
    [-12,-6,0,6,12].forEach(x => {
      const s = new THREE.Mesh(
        new THREE.BoxGeometry(0.15,0.06,18),
        new THREE.MeshStandardMaterial({
          color:0x9900ff, emissive:0x9900ff, emissiveIntensity:2
        })
      );
      s.position.set(x,1.55,-70); scene.add(s);
    });

    // WATERFRONT NEON STRIP
    const ws = new THREE.Mesh(
      new THREE.BoxGeometry(120,0.1,0.1),
      new THREE.MeshStandardMaterial({
        color:0x9900ff, emissive:0x9900ff, emissiveIntensity:2
      })
    );
    ws.position.set(0,0.9,12); scene.add(ws);
  },
  update() {}
};
