import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { engine } from "./engine.js";

/* =========================================================
   🚗 LAMBO CITY TRAFFIC SYSTEM (FREEWAY FOUNDATION)
========================================================= */

const carGroup = new THREE.Group();
engine.world.add(carGroup);

engine.cars = [];

/* =========================================================
   🚘 CAR CREATION
========================================================= */

function createCar(x, z, direction = 1, color = 0xff3333) {

  const car = new THREE.Mesh(
    new THREE.BoxGeometry(2, 1, 4),
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.6,
      metalness: 0.2
    })
  );

  car.position.set(x, 0.5, z);

  car.userData = {
    speed: 0.15 + Math.random() * 0.1,
    direction,
    laneZ: z
  };

  carGroup.add(car);
  engine.cars.push(car);

  return car;
}

/* =========================================================
   🛣 INITIAL TRAFFIC LINES (TEMP SYSTEM)
========================================================= */

// lane 1
for (let i = 0; i < 8; i++) {
  createCar(-30 + i * 10, -200, 1);
}

// lane 2
for (let i = 0; i < 8; i++) {
  createCar(30 - i * 10, -240, -1, 0x00aaff);
}

/* =========================================================
   🚗 TRAFFIC UPDATE LOOP
========================================================= */

function updateCars() {

  for (let car of engine.cars) {

    const data = car.userData;

    /* move forward/back like freeway flow */
    car.position.z += data.speed * data.direction;

    /* loop cars endlessly (infinite traffic illusion) */
    if (data.direction === 1 && car.position.z > 300) {
      car.position.z = -300;
    }

    if (data.direction === -1 && car.position.z < -300) {
      car.position.z = 300;
    }

    /* slight sway for realism */
    car.position.x += Math.sin(performance.now() * 0.001 + car.position.z) * 0.002;
  }
}

engine.updateCars = updateCars;
