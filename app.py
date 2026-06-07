from flask import Flask, render_template, request, session, redirect, url_for, send_file
from functools import wraps
import os
import hashlib

app = Flask(__name__)

# ============================================================
# CHAVE SECRETA — TROQUE POR UMA STRING ALEATÓRIA LONGA
# Gere uma em: https://randomkeygen.com/
# ============================================================
app.secret_key = "TroqueEssaChaveAqui_Gere_Uma_Aleatoria_2025!!"

# ============================================================
# USUÁRIOS E SENHAS
# Para adicionar usuário: coloque "usuario": "senha"
# Para remover: apague a linha
# ============================================================
USUARIOS = {
    "admin":    "vibra2025",
    "fersant":  "quantumvibra",
    # Adicione mais usuários aqui:
    # "cliente1": "senhacliente1",
    # "cliente2": "senhacliente2",
}

# ============================================================
# Tempo de sessão: 8 horas (em segundos)
# ============================================================
app.config['PERMANENT_SESSION_LIFETIME'] = 60 * 60 * 8


def login_required(f):
    """Decorator: bloqueia acesso se não estiver logado"""
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get('logado'):
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated


@app.route('/', methods=['GET', 'POST'])
def login():
    erro = None

    if request.method == 'POST':
        usuario = request.form.get('usuario', '').strip().lower()
        senha   = request.form.get('senha', '').strip()

        if usuario in USUARIOS and USUARIOS[usuario] == senha:
            session.permanent = True
            session['logado']  = True
            session['usuario'] = usuario
            return redirect(url_for('software'))
        else:
            erro = "Usuário ou senha incorretos."

    # Se já logado, vai direto pro software
    if session.get('logado'):
        return redirect(url_for('software'))

    return render_template('login.html', erro=erro)


@app.route('/software')
@login_required
def software():
    """Entrega o software APENAS para usuários autenticados"""
    caminho = os.path.join(app.root_path, 'static', 'quantum_vibrasync_v2.html')
    return send_file(caminho, mimetype='text/html')


@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
