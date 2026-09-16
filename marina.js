_buildWaterfrontRail(scene) {
    // LAMBO CITY — CONTINUOUS LUXURY WATERFRONT GLASS BORDER
    //
    // Runs across the entire brown waterfront zone:
    // STORE SIDE  →  HQ SIDE
    //
    // The Grand Stage / future hotel brown areas are intentionally
    // NOT included here.

    const railGroup = new THREE.Group();
    railGroup.name = "LuxuryWaterfrontGlassBorder";

    // ------------------------------------------------------------
    // MATERIALS
    // ------------------------------------------------------------

    const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0xdff7ff,
        transparent: true,
        opacity: 0.28,
        roughness: 0.08,
        metalness: 0.15,
        transmission: 0.35,
        thickness: 0.08
    });

    const goldMat = new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        metalness: 0.9,
        roughness: 0.2
    });

    const darkMetalMat = new THREE.MeshStandardMaterial({
        color: 0x151515,
        metalness: 0.85,
        roughness: 0.25
    });

    const glowMat = new THREE.MeshBasicMaterial({
        color: 0xffd86b,
        transparent: true,
        opacity: 0.65
    });

    // ------------------------------------------------------------
    // WATERFRONT LENGTH
    // ------------------------------------------------------------
    //
    // Continuous edge from the store-side waterfront
    // through the HQ-side waterfront.
    //

    const startX = -48;
    const endX = 35;
    const railZ = 10.15;

    const glassHeight = 1.65;
    const glassBottom = 0.55;

    // ------------------------------------------------------------
    // CONTINUOUS GLASS PANELS
    // ------------------------------------------------------------

    const panelWidth = 4.0;

    for (let x = startX; x <= endX; x += panelWidth) {
        const remaining = endX - x;
        const width = Math.min(panelWidth, remaining);

        if (width <= 0) continue;

        const panel = new THREE.Mesh(
            new THREE.BoxGeometry(
                width - 0.08,
                glassHeight,
                0.10
            ),
            glassMat
        );

        panel.position.set(
            x + width / 2,
            glassBottom + glassHeight / 2,
            railZ
        );

        railGroup.add(panel);
    }

    // ------------------------------------------------------------
    // GOLD TOP RAIL
    // ------------------------------------------------------------

    const topRail = new THREE.Mesh(
        new THREE.BoxGeometry(
            endX - startX,
            0.12,
            0.16
        ),
        goldMat
    );

    topRail.position.set(
        (startX + endX) / 2,
        glassBottom + glassHeight + 0.06,
        railZ
    );

    railGroup.add(topRail);

    // ------------------------------------------------------------
    // DARK LOWER SUPPORT RAIL
    // ------------------------------------------------------------

    const lowerRail = new THREE.Mesh(
        new THREE.BoxGeometry(
            endX - startX,
            0.10,
            0.14
        ),
        darkMetalMat
    );

    lowerRail.position.set(
        (startX + endX) / 2,
        glassBottom,
        railZ
    );

    railGroup.add(lowerRail);

    // ------------------------------------------------------------
    // VERTICAL GOLD POSTS
    // ------------------------------------------------------------

    for (let x = startX; x <= endX + 0.01; x += panelWidth) {
        const post = new THREE.Mesh(
            new THREE.BoxGeometry(
                0.13,
                glassHeight + 0.20,
                0.18
            ),
            goldMat
        );

        post.position.set(
            x,
            glassBottom + glassHeight / 2,
            railZ
        );

        railGroup.add(post);

        // Small luxury illuminated accent
        const accent = new THREE.Mesh(
            new THREE.BoxGeometry(
                0.06,
                0.34,
                0.03
            ),
            glowMat
        );

        accent.position.set(
            x,
            glassBottom + glassHeight * 0.52,
            railZ - 0.10
        );

        railGroup.add(accent);
    }

    // ------------------------------------------------------------
    // PREMIUM WATER EDGE BASE
    // ------------------------------------------------------------

    const base = new THREE.Mesh(
        new THREE.BoxGeometry(
            endX - startX,
            0.16,
            0.38
        ),
        darkMetalMat
    );

    base.position.set(
        (startX + endX) / 2,
        glassBottom - 0.08,
        railZ
    );

    railGroup.add(base);

    // ------------------------------------------------------------
    // END CAPS
    // ------------------------------------------------------------

    for (const x of [startX, endX]) {
        const cap = new THREE.Mesh(
            new THREE.BoxGeometry(
                0.24,
                glassHeight + 0.30,
                0.30
            ),
            goldMat
        );

        cap.position.set(
            x,
            glassBottom + glassHeight / 2,
            railZ
        );

        railGroup.add(cap);
    }

    scene.add(railGroup);
}
