import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/send', methods=['POST'])
def send_message():
    data = request.json
    
    message = data.get('message', '')
    destinations = data.get('destinations', [])
    email_config = data.get('email_config', {})
    line_token = data.get('line_token', '')
    send_line = data.get('send_line', True)
    send_email = data.get('send_email', True)
    
    results = {}
    
    # 1. Send via Email
    if send_email and email_config.get('email') and email_config.get('password') and destinations:
        try:
            msg = MIMEMultipart()
            msg['From'] = email_config['email']
            msg['To'] = email_config['email']
            msg['Subject'] = "連絡事項"
            
            msg.attach(MIMEText(message, 'plain'))
            
            server = smtplib.SMTP_SSL('smtp.mail.yahoo.co.jp', 465)
            server.login(email_config['email'], email_config['password'])
            server.sendmail(email_config['email'], destinations + [email_config['email']], msg.as_string())
            server.quit()
            
            results['email'] = 'success'
        except Exception as e:
            results['email'] = f'error: {str(e)}'
    else:
        results['email'] = 'skipped'

    # 2. Send via LINE
    if send_line and line_token:
        try:
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {line_token}'
            }
            line_data = {
                'messages': [
                    {
                        'type': 'text',
                        'text': message
                    }
                ]
            }
            response = requests.post('https://api.line.me/v2/bot/message/broadcast', headers=headers, json=line_data)
            if response.status_code == 200:
                results['line'] = 'success'
            else:
                results['line'] = f'error: {response.text}'
        except Exception as e:
            results['line'] = f'error: {str(e)}'
    else:
        results['line'] = 'skipped'

    return jsonify(results)

# Vercel requires the app object to be available
