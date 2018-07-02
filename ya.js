ymaps.ready(init);

function init() {
    var myMap = new ymaps.Map("map", {
        center: [53.4106, 58.9772],
        zoom: 13
    }, {
        searchControlProvider: 'yandex#search'
    }),
    searchControl = myMap.controls.get('searchControl');
    searchControl.options.set({noPlacemark: true, placeholderContent: 'Тут что-то ищем'});

    // Создаем многоугольник без вершин.
    var myPolygon = new ymaps.Polygon([], {}, {
        // Курсор в режиме добавления новых вершин.
        editorDrawingCursor: "crosshair",
        // Максимально допустимое количество вершин.
        editorMaxPoints: 10,
        // Цвет заливки.
        fillColor: 'rgba(228, 216, 216, 0.43)',
        // Цвет обводки.
        strokeColor: 'rgba(110, 79, 255, 0.43)',
        // Ширина обводки.
        strokeWidth: 2
    });



    // Проверим попадание результата поиска в одну из зон доставки.
    searchControl.events.add('load', function (e) {
        //console.log( searchControl.getResultsArray());
        obj = searchControl.getResultsArray();
        for(var i in obj) {
            highlightResult(obj[i]);
        }
    });

    // Добавляем многоугольник на карту.
    myMap.geoObjects.add(myPolygon);

    // В режиме добавления новых вершин меняем цвет обводки многоугольника.
    var stateMonitor = new ymaps.Monitor(myPolygon.editor.state);
    stateMonitor.add("drawing", function (newValue) {
        myPolygon.options.set("strokeColor", newValue ? 'rgba(110, 79, 255, 0.43)' : 'rgba(110, 79, 255, 0.43)');
    });

    // Включаем режим редактирования с возможностью добавления новых вершин.
    myPolygon.editor.startDrawing();

    var deliveryZones = ymaps.geoQuery(myPolygon).addToMap(myMap);

    function highlightResult(obj) {
        // Сохраняем координаты переданного объекта.
        var coords = obj.geometry.getCoordinates(),
            // Находим полигон, в который входят переданные координаты.
            polygon = deliveryZones.searchContaining(coords).get(0);
        ymaps.geocode(coords, {kind: 'house'}).then(function (res) {
            console.log(res);
        });
        var deliveryPoint = new ymaps.GeoObject({
            geometry: {type: 'Point',
                coordinates: [
                    coords
                ]},
            properties: {iconCaption: 'Адрес'}
        }, {
            preset: 'islands#blackDotIconWithCaption',
            draggable: true,
            iconCaptionMaxWidth: '215'
        });
        if (polygon) {
            // Уменьшаем прозрачность всех полигонов, кроме того, в который входят переданные координаты.
            deliveryZones.setOptions('fillOpacity', 0.4);
            polygon.options.set('fillOpacity', 0.8);
            // Перемещаем метку с подписью в переданные координаты и перекрашиваем её в цвет полигона.
            deliveryPoint.geometry.setCoordinates(coords);
            deliveryPoint.options.set('iconColor', polygon.options.get('fillColor'));
            // Задаем подпись для метки.
            if (typeof(obj.getThoroughfare) === 'function') {
                setData(obj);
            } else {
                // Если вы не хотите, чтобы при каждом перемещении метки отправлялся запрос к геокодеру,
                // закомментируйте код ниже.
                ymaps.geocode(coords, {results: 1}).then(function (res) {
                    var obj = res.geoObjects.get(0);
                    setData(obj);
                });
            }
        } else {
            // Если переданные координаты не попадают в полигон, то задаём стандартную прозрачность полигонов.
            deliveryZones.setOptions('fillOpacity', 0.4);
            // Перемещаем метку по переданным координатам.
            deliveryPoint.geometry.setCoordinates(coords);
            // Задаём контент балуна и метки.
            deliveryPoint.properties.set({
                iconCaption: 'Я не в выделенной области',
                balloonContent: '',
                balloonContentHeader: ''
            });
            // Перекрашиваем метку в чёрный цвет.
            deliveryPoint.options.set('iconColor', 'black');
        }

        function setData(obj){
            myMap.geoObjects.add(deliveryPoint);
            var address = [obj.getThoroughfare(), obj.getPremiseNumber(), obj.getPremise()].join(' ');
            if (address.trim() === '') {
                address = obj.getAddressLine();
            }
            deliveryPoint.properties.set({
                iconCaption: address,
                balloonContent: address,
                balloonContentHeader: 'bla-bla'
            });
        }
    }
}
