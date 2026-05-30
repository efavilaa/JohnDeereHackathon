import sys
from pathlib import Path
from PySide6.QtGui import QGuiApplication
from PySide6.QtQml import QQmlApplicationEngine
from PySide6.QtCore import QObject, Property

# This class acts as the "backend" mentioned in your QML
class Backend(QObject):
    @Property(float)
    def consumption(self):
        return 12.5  # This is the number that will appear in green

if __name__ == "__main__":
    app = QGuiApplication(sys.argv)
    engine = QQmlApplicationEngine()

    # 1. Create the backend object
    backend = Backend()
    
    # 2. Inject it into the QML context so "backend.consumption" works
    engine.rootContext().setContextProperty("backend", backend)

    # 3. Load your QML file
    qml_file = Path(__file__).parent / "main.qml"
    engine.load(qml_file)

    if not engine.rootObjects():
        sys.exit(-1)
    
    sys.exit(app.exec())