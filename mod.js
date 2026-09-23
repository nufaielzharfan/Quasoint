(() => {
  "use strict";

  // Quasoint - editor test-drive path trail.
  // This implementation uses the Three.js scene/camera already exposed by
  // the browser page when possible. Because PolyTrack's internal names can
  // change between versions, the position discovery is deliberately defensive.

  window.PolyTrackMods.register({
    id: "quasoint",

    activate(api) {
      api.log("Quasoint activated");

      const state = {
        points: [],
        line: null,
        timer: null,
        scene: null,
        THREE: null,
        last: null,
        enabled: true,
      };

      function findThree() {
        return window.THREE || null;
      }

      function findScene() {
        // Common locations used by Three.js applications.
        const candidates = [
          window.scene,
          window.game?.scene,
          window.renderer?.scene,
          window.app?.scene,
          window.gameState?.scene
        ];
        return candidates.find(x => x && x.add && x.remove) || null;
      }

      function findCar() {
        // Try a few common game/application locations.
        const roots = [
          window.game, window.app, window.gameState, window.simulation,
          window.player, window.car
        ].filter(Boolean);

        for (const root of roots) {
          const candidates = [
            root.playerCar, root.car, root.player,
            root.mainCar, root.activeCar, root.vehicle
          ];
          const car = candidates.find(x => x?.position &&
                                            typeof x.position.x === "number");
          if (car) return car;
        }

        // Last-resort recursive shallow scan of window globals.
        for (const key of Object.keys(window)) {
          let value;
          try { value = window[key]; } catch (_) { continue; }
          if (value?.position &&
              typeof value.position.x === "number" &&
              typeof value.position.y === "number" &&
              typeof value.position.z === "number") {
            if (/car|player|vehicle/i.test(key)) return value;
          }
        }
        return null;
      }

      function clearTrail() {
        if (state.line && state.scene) {
          state.scene.remove(state.line);
          state.line.geometry?.dispose?.();
          state.line.material?.dispose?.();
        }
        state.line = null;
        state.points.length = 0;
        state.last = null;
      }

      function createTrail() {
        if (!state.scene || !state.THREE) return;

        clearTrail();

        const geometry = new state.THREE.BufferGeometry();
        const material = new state.THREE.LineBasicMaterial({
          color: 0xffd21f,
          transparent: true,
          opacity: 0.9
        });

        state.line = new state.THREE.Line(geometry, material);
        state.line.frustumCulled = false;
        state.scene.add(state.line);
      }

      function addPoint(car) {
        if (!state.line || !state.THREE) return;

        const p = car.position;
        const current = { x: p.x, y: p.y, z: p.z };

        // Don't add points when the car has barely moved.
        if (state.last) {
          const dx = current.x - state.last.x;
          const dy = current.y - state.last.y;
          const dz = current.z - state.last.z;
          if (dx * dx + dy * dy + dz * dz < 0.04) return;
        }

        state.last = current;
        state.points.push(current);

        const positions = new Float32Array(state.points.length * 3);
        for (let i = 0; i < state.points.length; i++) {
          const q = state.points[i];
          positions[i * 3] = q.x;
          positions[i * 3 + 1] = q.y + 0.12;
          positions[i * 3 + 2] = q.z;
        }

        state.line.geometry.setAttribute(
          "position",
          new state.THREE.BufferAttribute(positions, 3)
        );
        state.line.geometry.computeBoundingSphere();
      }

      function tick() {
        if (!state.enabled) return;

        state.scene ||= findScene();
        state.THREE ||= findThree();

        const car = findCar();

        if (state.scene && state.THREE && car) {
          if (!state.line) createTrail();
          addPoint(car);
        }
      }

      // Small UI button so the trail can be cleared without restarting.
      api.injectStyle(`
        #quasoint-clear {
          position: fixed;
          right: 16px;
          bottom: 16px;
          z-index: 1000000;
          border: 0;
          border-radius: 6px;
          padding: 8px 12px;
          background: rgba(20,20,20,.8);
          color: white;
          font: 13px sans-serif;
          cursor: pointer;
          display: none;
        }
        #quasoint-clear:hover { background: rgba(40,40,40,.9); }
      `);

      const button = document.createElement("button");
      button.id = "quasoint-clear";
      button.textContent = "Clear Quasoint Trail";
      button.onclick = clearTrail;
      document.body.appendChild(button);

      state.timer = setInterval(tick, 33);

      // Expose a tiny debugging API for the console.
      window.Quasoint = {
        clear: clearTrail,
        enable() { state.enabled = true; },
        disable() { state.enabled = false; clearTrail(); },
        points: () => state.points.length
      };

      // Show the button once the game has a scene/car.
      const buttonTimer = setInterval(() => {
        if (findScene() && findCar()) button.style.display = "block";
      }, 500);
      state.buttonTimer = buttonTimer;

      state.cleanup = () => {
        clearInterval(state.timer);
        clearInterval(state.buttonTimer);
        clearTrail();
        button.remove();
        delete window.Quasoint;
      };
    },

    deactivate(api) {
      api.log("Quasoint deactivated");
      // The current loader API does not retain activation state for us, so
      // cleanup is handled by the page lifecycle/reload.
    }
  });
})();
