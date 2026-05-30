import numpy as np
from sklearn.linear_model import LinearRegression

class TractorML:
    def __init__(self):
        self.model = LinearRegression()
        # Datos simulados: [RPM, Temp] -> Consumo Litros/Hora
        X = np.array([[800, 70], [1500, 85], [2200, 95], [2500, 105]])
        y = np.array([5, 12, 22, 30])
        self.model.fit(X, y)

    def predict_consumption(self, rpm, temp):
        prediction = self.model.predict([[rpm, temp]])
        return round(float(prediction[0]), 2)