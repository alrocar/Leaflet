L.TileLayer.POIProxy = L.TileLayer.extend({
	options: {
		async: true,
		iconURL: null,
        service: ""
	},

	initialize: function (url, options) {
		//registrarse al evento tileunload para cancelar peticiones y si el tile tiene src eliminar la capa geojson correspondiente porque el tile ya no sirve
		//hacer las peticiones en drawTile
		//poner async a true y cuando llegue el geoJSON
		//crear una capa geoJson pasándole el contenido, añadirla al mapa y llamar a tileDrawn, el nombre de la capa puede ser la url
		this._url = url;
		this.on("tileunload", this._removeJSON, this);
		L.Util.setOptions(this, options);
	},
    
    _removeLayer: function (layer) {
        var layer_;
        for (var layerIndex in this._map._layers) {
			layer_ = this._map._layers[layerIndex];
			if (layer && layer_ && layer.options && layer.options_ && layer.options.service && layer_.options.service && layer.options.service === layer_.options.service) {
				this._map.removeLayer(layer_);
			}
		}
    },

	_removeJSON: function (tile) {
		var i = 0;
		var layer;
		for (var layerIndex in this._map._layers) {
			layer = this._map._layers[layerIndex];
			if (layer.options.req && tile.tile.req && layer.options.req === tile.tile.req) {
				this._map.removeLayer(layer);
			}
		}
		
	},

//	_createTileProto: function () {
//		this._canvasProto = L.DomUtil.create('canvas', 'leaflet-tile');

//		var tileSize = this.options.tileSize;
//		this._canvasProto.width = tileSize;
//		this._canvasProto.height = tileSize;
//	},

//	_createTile: function () {
//		var tile = this._canvasProto.cloneNode(false);
//		tile.onselectstart = tile.onmousemove = L.Util.falseFn;
//		return tile;
//	},

	_loadTile: function (tile, tilePoint, zoom) {
		tile._layer = this;

		this.drawTile(tile, tilePoint, zoom);

		if (!this.options.async) {
			this.tileDrawn(tile);
		}
	},

	drawTile: function (tile, tilePoint, zoom) {
        if (!this._listenRemove) {
            this._map.on("layerremove", this._removeLayer, this);
            this._listenRemove = true;
        }
        if (zoom < 16) {
            return;
        }
		// override with rendering code
		var zoo = zoom;
		var url = this.getTileUrl(tilePoint, zoom);
		tile.req = zoom + ":" + tilePoint.x + ":" + tilePoint.y;
		var t = tile;
		var iconURL = this.options.iconURL;
		var Icon = L.Icon.extend({
			iconUrl: iconURL,
            shadowUrl: null,
			iconSize: new L.Point(32, 32)
		});
        if (!this.icon) {
            this.icon = new Icon();
        }
        var ctx = this;
        
        var _icon = this.icon;
		var map = this._map;
		$.getJSON(url, function (data) {
			var geojson = new L.GeoJSON(null, {req: t.req, service : ctx.options.service, pointToLayer: function (latlng) {
				return new L.Marker(latlng, {
					icon: _icon
				});
			}});
			geojson.on("featureparse", function (e) {
				e.layer.options.req = e.target.options.req;
                e.layer.options.service = e.target.options.service;
				if (e.properties) {
					var popupContent = "";
					popupContent += "<strong>" + ctx.options.service.toUpperCase() + "</strong>";
                    popupContent += "<br>";
                    popupContent += "<br>";
					for (var prop in e.properties) {
						if (e.properties[prop].indexOf("http") !== -1) {
							if ((e.properties[prop].indexOf("png") !== -1 || e.properties[prop].indexOf("jpg") !== -1 || e.properties[prop].indexOf("jpeg") !== -1) && prop.indexOf("url_m") === -1 && prop.indexOf("url_s") === -1 && prop.indexOf("url_z") === -1 && prop.indexOf("url_z") === -1 && prop.indexOf("url_l") === -1 && prop.indexOf("url_o") === -1) {
								popupContent += "<img src='" + e.properties[prop] + "'/>";
								popupContent += "<br>";
							} else {
								popupContent += "<a href='" + e.properties[prop] + "'>" + prop + "</a>";
								popupContent += "<br>";
							}
						} else {
							popupContent += "<strong>" + prop + ": </strong>" + e.properties[prop];
							popupContent += "<br>";
						}
					}
					e.layer.bindPopup(popupContent);
				}
			});
			geojson.addGeoJSON(data);
			map.addLayer(geojson);
		});
		var geojson = new L.GeoJSON();
	},

	tileDrawn: function (tile) {
		this._tileOnLoad.call(tile);
	}
});
