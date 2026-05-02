import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';

export default function MapComponent({ busLocation, routeCoordinates, theme, style }: any) {
    const [LeafletMap, setLeafletMap] = useState<any>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            Promise.all([
                import('react-leaflet'),
                import('leaflet')
            ]).then(([ReactLeaflet, LModule]) => {
                const L = LModule.default || LModule;
                
                require('leaflet/dist/leaflet.css');

                delete (L.Icon.Default.prototype as any)._getIconUrl;
                L.Icon.Default.mergeOptions({
                    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
                    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                });

                setLeafletMap({
                    MapContainer: ReactLeaflet.MapContainer,
                    TileLayer: ReactLeaflet.TileLayer,
                    Marker: ReactLeaflet.Marker,
                    Polyline: ReactLeaflet.Polyline,
                    Popup: ReactLeaflet.Popup
                });
            }).catch(e => console.error("Could not load leaflet", e));
        }
    }, []);

    const defaultCenter: [number, number] = busLocation 
        ? [busLocation.latitude, busLocation.longitude] 
        : [7.8731, 80.7718];

    const leafletCoordinates = routeCoordinates?.map((c: any) => [c.latitude, c.longitude]) || [];

    if (!LeafletMap) {
        return (
            <View style={[style, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{color: '#666'}}>Loading Map...</Text>
            </View>
        );
    }

    const { MapContainer, TileLayer, Marker, Polyline, Popup } = LeafletMap;

    return (
        <View style={style}>
            <View style={[StyleSheet.absoluteFillObject, { zIndex: 0 }]}>
                <MapContainer 
                    key={defaultCenter.toString()} 
                    center={defaultCenter} 
                    zoom={12} 
                    style={{ height: '100%', width: '100%', zIndex: 0 }}
                >
                    <TileLayer
                        attribution='&copy; OpenStreetMap'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {busLocation && (
                        <Marker position={[busLocation.latitude, busLocation.longitude]}>
                            <Popup>Bus Location</Popup>
                        </Marker>
                    )}
                    {routeCoordinates && routeCoordinates.length > 0 && (
                        <Polyline positions={leafletCoordinates} color={theme?.tint || '#D4AF37'} weight={4} />
                    )}
                </MapContainer>
            </View>
        </View>
    );
}
