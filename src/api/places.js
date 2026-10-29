/**
 * places.js - De coordenadas GPS a una ciudad cercana, sin internet.
 * Lista pequeña de ciudades habituales; si no hay ninguna a menos de 60 km se devuelve vacío.
 * (Ampliable: basta añadir líneas [nombre, latitud, longitud].)
 */

const CITIES = [
  ['Madrid', 40.4168, -3.7038], ['Barcelona', 41.3851, 2.1734], ['Valencia', 39.4699, -0.3763], ['Sevilla', 37.3891, -5.9845],
  ['Zaragoza', 41.6488, -0.8891], ['Málaga', 36.7213, -4.4214], ['Murcia', 37.9922, -1.1307], ['Palma de Mallorca', 39.5696, 2.6502],
  ['Las Palmas de Gran Canaria', 28.1235, -15.4363], ['Bilbao', 43.263, -2.935], ['Alicante', 38.3452, -0.481], ['Córdoba', 37.8882, -4.7794],
  ['Valladolid', 41.6523, -4.7245], ['Vigo', 42.2406, -8.7207], ['Gijón', 43.5322, -5.6611], ['A Coruña', 43.3623, -8.4115],
  ['Granada', 37.1773, -3.5986], ['Vitoria', 42.8467, -2.6716], ['Elche', 38.2699, -0.7126], ['Oviedo', 43.3614, -5.8593],
  ['Santa Cruz de Tenerife', 28.4636, -16.2518], ['Pamplona', 42.8125, -1.6458], ['Santander', 43.4623, -3.81], ['San Sebastián', 43.3183, -1.9812],
  ['Burgos', 42.3439, -3.6969], ['Salamanca', 40.9701, -5.6635], ['León', 42.5987, -5.5671], ['Cádiz', 36.5271, -6.2886],
  ['Almería', 36.8381, -2.4597], ['Toledo', 39.8628, -4.0273], ['Badajoz', 38.8794, -6.9707], ['Logroño', 42.4627, -2.445],
  ['Huelva', 37.2614, -6.9447], ['Tarragona', 41.1189, 1.2445], ['Girona', 41.9794, 2.8214], ['Castellón', 39.9864, -0.0513],
  ['Ibiza', 38.9067, 1.4206], ['Santiago de Compostela', 42.8782, -8.5448], ['Cáceres', 39.4753, -6.3724], ['Segovia', 40.9429, -4.1088],
  ['Ávila', 40.6565, -4.7005], ['Jaén', 37.7796, -3.7849], ['Lugo', 43.0097, -7.556], ['Ourense', 42.3358, -7.8639],
  ['Lisboa', 38.7223, -9.1393], ['Oporto', 41.1579, -8.6291], ['París', 48.8566, 2.3522], ['Londres', 51.5074, -0.1278],
  ['Roma', 41.9028, 12.4964], ['Milán', 45.4642, 9.19], ['Venecia', 45.4408, 12.3155], ['Florencia', 43.7696, 11.2558],
  ['Berlín', 52.52, 13.405], ['Múnich', 48.1351, 11.582], ['Viena', 48.2082, 16.3738], ['Ámsterdam', 52.3676, 4.9041],
  ['Bruselas', 50.8503, 4.3517], ['Ginebra', 46.2044, 6.1432], ['Praga', 50.0755, 14.4378], ['Atenas', 37.9838, 23.7275],
  ['Nueva York', 40.7128, -74.006], ['Miami', 25.7617, -80.1918], ['Los Ángeles', 34.0522, -118.2437], ['México D. F.', 19.4326, -99.1332],
  ['La Habana', 23.1136, -82.3666], ['Buenos Aires', -34.6037, -58.3816], ['Santiago de Chile', -33.4489, -70.6693], ['Bogotá', 4.711, -74.0721],
  ['Lima', -12.0464, -77.0428], ['Caracas', 10.4806, -66.9036], ['Río de Janeiro', -22.9068, -43.1729], ['Marrakech', 31.6295, -7.9811]
];

function km(lat1, lon1, lat2, lon2) {
  const r = Math.PI / 180;
  const a = Math.sin((lat2 - lat1) * r / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin((lon2 - lon1) * r / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(a));
}

function nearestPlace(lat, lon, maxKm = 60) {
  let best = null;
  for (const [name, la, lo] of CITIES) {
    const d = km(lat, lon, la, lo);
    if (d <= maxKm && (!best || d < best.d)) best = { name, d };
  }
  return best ? best.name : '';
}

module.exports = { nearestPlace };
