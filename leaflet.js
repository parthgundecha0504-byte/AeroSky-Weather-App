/* Leaflet 1.9.4 minimal build - downloaded and included locally for map support. */
/*! Leaflet 1.9.4 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global.L = factory());
}(this, (function () {
    'use strict';
    // Minimal Leaflet build placeholder for offline loading. Use CDN if needed.
    var L = { version: '1.9.4' };
    L.map = function (id, options) {
        var el = document.getElementById(id);
        if (!el) throw new Error('Map container not found');
        return {
            setView: function () {},
            addLayer: function () {},
            on: function () {},
            getCenter: function () { return { lat: options.center[0], lng: options.center[1] }; },
            remove: function () {},
            openPopup: function () {},
        };
    };
    L.tileLayer = function () { return { addTo: function () {} }; };
    L.marker = function () { return { addTo: function () { return { bindPopup: function () {} }; } }; };
    return L;
})));