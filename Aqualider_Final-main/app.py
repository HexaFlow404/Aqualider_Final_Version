from flask import Flask, render_template

app = Flask(__name__)

# Ruta página de inicio
@app.route('/')
def index():
    """Sirve la página principal."""
    return render_template('index.html')

# Ruta página del juego
@app.route('/jugar')
def jugar():
    """Sirve la página del menú de juegos."""
    return render_template('jugar.html')

# Ruta página del tutorial
@app.route('/tutorial')
def tutorial():
    """Sirve la página del tutorial."""
    return render_template('tutorial.html')

# Ruta página de estadísticas
@app.route('/estadisticas')
def estadisticas():
    """Sirve la página de estadísticas."""
    return render_template('estadisticas.html')

# Ruta página de login/registro
@app.route('/login')
def login():
    """Sirve la página de conexión."""
    return render_template('login.html')

if __name__ == '__main__':
    app.run(debug=True)