# Backend Endpoint: Contact Request Email

## Endpoint Requerido

**POST** `/api/contact-request`

Este endpoint debe enviar un email automáticamente cuando un usuario solicita un plan.

## Request Body

```json
{
  "plan_name": "Starter",
  "plan_price": "$49",
  "user_email": "user@example.com",
  "user_name": "John Doe",
  "recipient_email": "iriyidan@gmail.com"
}
```

## Response

### Success (200 OK)
```json
{
  "status": "success",
  "message": "Contact request sent successfully"
}
```

### Error (400/500)
```json
{
  "status": "error",
  "message": "Failed to send email"
}
```

## Implementación Backend (Python/Flask)

```python
from flask import Blueprint, request, jsonify
from flask_mail import Mail, Message
import os

contact_bp = Blueprint('contact', __name__)
mail = Mail()

@contact_bp.route('/api/contact-request', methods=['POST'])
def send_contact_request():
    """
    Envía un email automático cuando un usuario solicita un plan.
    """
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        required_fields = ['plan_name', 'plan_price', 'user_email', 'user_name', 'recipient_email']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'status': 'error',
                    'message': f'Missing required field: {field}'
                }), 400
        
        # Preparar contenido del email
        subject = f"Plan Request: {data['plan_name']} Plan"
        
        body = f"""
Hello,

A new plan request has been received:

User Information:
- Name: {data['user_name']}
- Email: {data['user_email']}

Plan Details:
- Plan: {data['plan_name']}
- Price: {data['plan_price']}/month

Please contact the user to set up this plan.

Thank you!
        """
        
        # Crear y enviar email
        msg = Message(
            subject=subject,
            sender=os.getenv('MAIL_DEFAULT_SENDER', 'noreply@budyai.com'),
            recipients=[data['recipient_email']],
            body=body
        )
        
        mail.send(msg)
        
        return jsonify({
            'status': 'success',
            'message': 'Contact request sent successfully'
        }), 200
        
    except Exception as e:
        print(f"Error sending contact request email: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to send email'
        }), 500
```

## Configuración Flask-Mail

Agregar en tu archivo de configuración del backend:

```python
# config.py o app.py
from flask_mail import Mail

app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')  # Tu email
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')  # App password de Gmail
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER', 'noreply@budyai.com')

mail = Mail(app)
```

## Variables de Entorno (.env)

```bash
MAIL_USERNAME=tu-email@gmail.com
MAIL_PASSWORD=tu-app-password-de-gmail
MAIL_DEFAULT_SENDER=noreply@budyai.com
```

## Cómo Obtener App Password de Gmail

1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. Seguridad → Verificación en 2 pasos (debe estar activada)
3. Contraseñas de aplicaciones
4. Selecciona "Correo" y "Otro (nombre personalizado)"
5. Copia la contraseña generada (16 caracteres)
6. Úsala en `MAIL_PASSWORD`

## Instalación de Dependencias

```bash
pip install Flask-Mail
```

## Alternativa: SendGrid (Recomendado para Producción)

Si prefieres usar SendGrid en lugar de Gmail:

```python
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

@contact_bp.route('/api/contact-request', methods=['POST'])
def send_contact_request():
    try:
        data = request.get_json()
        
        message = Mail(
            from_email='noreply@budyai.com',
            to_emails=data['recipient_email'],
            subject=f"Plan Request: {data['plan_name']} Plan",
            html_content=f"""
                <h2>New Plan Request</h2>
                <p><strong>User:</strong> {data['user_name']} ({data['user_email']})</p>
                <p><strong>Plan:</strong> {data['plan_name']}</p>
                <p><strong>Price:</strong> {data['plan_price']}/month</p>
            """
        )
        
        sg = SendGridAPIClient(os.getenv('SENDGRID_API_KEY'))
        response = sg.send(message)
        
        return jsonify({
            'status': 'success',
            'message': 'Contact request sent successfully'
        }), 200
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to send email'
        }), 500
```

```bash
pip install sendgrid
```

## CORS Configuration

Asegúrate de que el backend tenga CORS configurado para POST:

```python
from flask_cors import CORS

CORS(app, methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
```

## Testing

### cURL
```bash
curl -X POST http://localhost:5001/api/contact-request \
  -H "Content-Type: application/json" \
  -d '{
    "plan_name": "Starter",
    "plan_price": "$49",
    "user_email": "test@example.com",
    "user_name": "Test User",
    "recipient_email": "iriyidan@gmail.com"
  }'
```

### Respuesta Esperada
```json
{
  "status": "success",
  "message": "Contact request sent successfully"
}
```

## Notas Importantes

1. **Gmail tiene límites de envío**: 500 emails/día para cuentas gratuitas
2. **SendGrid es mejor para producción**: 100 emails/día gratis, más confiable
3. **Validar email del usuario**: Considera agregar validación de formato
4. **Rate limiting**: Implementa límite de requests para evitar spam
5. **Logging**: Registra todos los envíos para auditoría

## Frontend ya está listo

El frontend en `app/(workspace)/checkout/page.tsx` ya está configurado para llamar a este endpoint automáticamente cuando el usuario hace clic en "Contact Us".
