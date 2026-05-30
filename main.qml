import QtQuick 2.15
import QtQuick.Controls 2.15

ApplicationWindow {
    visible: true
    width: 400
    height: 300
    title: "John Deere Prototipo"
    color: "#363636" // Gris oscuro industrial

    Column {
        anchors.centerIn: parent
        spacing: 20

        Text {
            text: "Consumo Estimado (ML):"
            color: "white"
            font.pixelSize: 18
        }

        Text {
            id: consumptionDisplay
            text: backend.consumption + " L/h"
            color: "#367C2B" // Verde John Deere
            font.pixelSize: 48
            font.bold: true
        }
        
        // Aquí irían tus sliders o entradas para simular sensores
    }
}