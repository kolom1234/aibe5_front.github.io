// Seoul Map Controller
const SeoulMap = (function () {
    let isInitialized = false;
    let naverMap = null;
    const SEOUL_GEOJSON_URL = 'https://raw.githubusercontent.com/southkorea/seoul-maps/master/kostat/2013/json/seoul_municipalities_geo_simple.json';

    // District Centroids (Approximate)
    const districtCoords = {
        "강남구": { lat: 37.5172, lng: 127.0473 },
        "강동구": { lat: 37.5301, lng: 127.1238 },
        "강북구": { lat: 37.6396, lng: 127.0257 },
        "강서구": { lat: 37.5509, lng: 126.8497 },
        "관악구": { lat: 37.4784, lng: 126.9516 },
        "광진구": { lat: 37.5385, lng: 127.0822 },
        "구로구": { lat: 37.4954, lng: 126.8874 },
        "금천구": { lat: 37.4565, lng: 126.8954 },
        "노원구": { lat: 37.6542, lng: 127.0563 },
        "도봉구": { lat: 37.6688, lng: 127.0471 },
        "동대문구": { lat: 37.5744, lng: 127.0400 },
        "동작구": { lat: 37.5124, lng: 126.9393 },
        "마포구": { lat: 37.5663, lng: 126.9016 },
        "서대문구": { lat: 37.5791, lng: 126.9368 },
        "서초구": { lat: 37.4837, lng: 127.0324 },
        "성동구": { lat: 37.5633, lng: 127.0371 },
        "성북구": { lat: 37.5891, lng: 127.0182 },
        "송파구": { lat: 37.5145, lng: 127.1066 },
        "양천구": { lat: 37.5169, lng: 126.8660 },
        "영등포구": { lat: 37.5264, lng: 126.8962 },
        "용산구": { lat: 37.5326, lng: 126.9904 },
        "은평구": { lat: 37.6027, lng: 126.9291 },
        "종로구": { lat: 37.5730, lng: 126.9794 },
        "중구": { lat: 37.5641, lng: 126.9979 },
        "중랑구": { lat: 37.6063, lng: 127.0926 }
    };

    // Init function
    async function init() {
        if (isInitialized) return;

        try {
            console.log("Loading Seoul Map Data...");
            const response = await fetch(SEOUL_GEOJSON_URL);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
            renderGeoJSONToSVG(data);
            isInitialized = true;
            console.log("Seoul Map Rendered Successfully");
        } catch (error) {
            console.error('Failed to load map data:', error);
            const loadingText = document.getElementById('loading-text');
            if (loadingText) {
                loadingText.textContent = "지도를 불러오는데 실패했습니다.";
                loadingText.style.fill = "#ff6b6b";
            }
        }
    }

    function renderGeoJSONToSVG(geojson) {
        const svg = document.getElementById('seoul-svg');
        if (!svg) return;

        const loadingText = document.getElementById('loading-text');
        if (loadingText) loadingText.remove();

        // Calculate Bounds
        let minLng = 180, maxLng = -180, minLat = 90, maxLat = -90;
        geojson.features.forEach(feature => {
            feature.geometry.coordinates.forEach(polygon => {
                const coords = Array.isArray(polygon[0][0]) ? polygon.flat() : polygon;
                coords.forEach(pt => {
                    const [lng, lat] = Array.isArray(pt) ? pt : [0, 0];
                    if (lng < minLng) minLng = lng;
                    if (lng > maxLng) maxLng = lng;
                    if (lat < minLat) minLat = lat;
                    if (lat > maxLat) maxLat = lat;
                });
            });
        });

        // Add padding
        const padding = 0.02;
        minLng -= padding; maxLng += padding;
        minLat -= padding; maxLat += padding;

        // Use viewBox dimensions
        const width = 800;
        const height = 600;

        // Projection
        function project(lng, lat) {
            const x = (lng - minLng) / (maxLng - minLng) * width;
            const y = height - ((lat - minLat) / (maxLat - minLat) * height);
            return [x, y];
        }

        // Render Paths
        geojson.features.forEach(feature => {
            const name = feature.properties.name || feature.properties.SIG_KOR_NM;
            let pathData = "";

            const processPolygon = (ring) => {
                return "M" + ring.map(pt => {
                    const [x, y] = project(pt[0], pt[1]);
                    return `${x},${y}`;
                }).join(" ") + "Z";
            };

            if (feature.geometry.type === 'Polygon') {
                pathData = feature.geometry.coordinates.map(processPolygon).join(" ");
            } else if (feature.geometry.type === 'MultiPolygon') {
                pathData = feature.geometry.coordinates.map(poly => poly.map(processPolygon).join(" ")).join(" ");
            }

            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", pathData);
            path.setAttribute("class", "district-path");
            path.setAttribute("data-name", name);

            // Click Event: Switch to Naver Map
            path.onclick = () => {
                const coords = districtCoords[name];
                if (coords) {
                    showNaverMap(name, coords.lat, coords.lng);
                } else {
                    console.log(`No coordinates found for ${name}`);
                    // Fallback to center of Seoul if not found
                    showNaverMap(name, 37.5665, 126.9780);
                }
            };

            // Tooltip
            const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
            title.textContent = name;
            path.appendChild(title);

            svg.appendChild(path);
        });
    }

    function showNaverMap(name, lat, lng) {
        const seoulWrapper = document.getElementById('seoul-map-wrapper');
        const naverWrapper = document.getElementById('naver-map-wrapper');

        // Visual Transition
        seoulWrapper.classList.add('hidden');
        naverWrapper.classList.add('active');

        // Initialize Naver Map if first time, else move to new location
        if (!naverMap) {
            console.log("Initializing Naver Map (Dark Mode via CSS)");
            naverMap = new naver.maps.Map('naver-map', {
                center: new naver.maps.LatLng(lat, lng),
                zoom: 15,
                mapDataControl: false,
                scaleControl: false
            });
        } else {
            const newCenter = new naver.maps.LatLng(lat, lng);
            naverMap.setCenter(newCenter);
            naverMap.setZoom(15);
        }

        console.log(`Switched to Naver Map: ${name}`);
    }

    function backToSeoul() {
        const seoulWrapper = document.getElementById('seoul-map-wrapper');
        const naverWrapper = document.getElementById('naver-map-wrapper');

        naverWrapper.classList.remove('active');
        seoulWrapper.classList.remove('hidden');

        // Reset view/selection style if needed
        renderGeoJSONToSVG(); // Optional: re-render or just reset classes
    }

    // Toggle Functionality
    function toggle() {
        const section = document.getElementById('seoul-map-section');
        const text = document.getElementById('map-toggle-text');
        const icon = document.getElementById('map-toggle-icon');

        if (!section) return;

        // If closing while in detailed view, reset to main view?
        // Optional: keep state. Let's reset for better UX if user closes and reopens.
        const isActive = section.classList.contains('active');

        if (isActive) {
            // Closing
            section.classList.remove('active');
            text.textContent = '지도로 보기';
            icon.innerHTML = `
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
            `;

            // Optional delay reset
            setTimeout(() => {
                backToSeoul();
            }, 500);

        } else {
            // Opening
            section.classList.add('active');
            init(); // Ensure init
            text.textContent = '지도 닫기';
            icon.innerHTML = `<path d="M18 6L6 18M6 6l12 12"/>`;
        }
    }

    return {
        init,
        toggle,
        backToSeoul
    };
})();
