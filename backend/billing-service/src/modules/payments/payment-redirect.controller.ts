import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller('payment')
export class PaymentRedirectController {
  @Get('success')
  handleSuccess(@Query('session_id') sessionId: string, @Res() res: Response) {
    console.log('✅ Payment success redirect:', sessionId);
    
    // Redirect to a success page or close the window
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment Successful</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              text-align: center;
              background: white;
              padding: 3rem;
              border-radius: 20px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              max-width: 400px;
            }
            .icon {
              width: 80px;
              height: 80px;
              background: #10b981;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 2rem;
            }
            .checkmark {
              width: 40px;
              height: 40px;
              border: 4px solid white;
              border-radius: 50%;
              position: relative;
            }
            .checkmark:after {
              content: '';
              position: absolute;
              width: 12px;
              height: 24px;
              border: solid white;
              border-width: 0 4px 4px 0;
              transform: rotate(45deg);
              left: 12px;
              top: 4px;
            }
            h1 {
              color: #1f2937;
              margin: 0 0 1rem;
              font-size: 2rem;
            }
            p {
              color: #6b7280;
              margin: 0 0 2rem;
              font-size: 1.1rem;
            }
            .info {
              background: #f3f4f6;
              padding: 1rem;
              border-radius: 10px;
              margin-bottom: 1.5rem;
            }
            .info p {
              margin: 0.5rem 0;
              font-size: 0.9rem;
            }
            button {
              background: #667eea;
              color: white;
              border: none;
              padding: 1rem 2rem;
              border-radius: 10px;
              font-size: 1rem;
              font-weight: 600;
              cursor: pointer;
              transition: background 0.3s;
            }
            button:hover {
              background: #5568d3;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">
              <div class="checkmark"></div>
            </div>
            <h1>Payment Successful!</h1>
            <p>Your credits have been added to your account.</p>
            <div class="info">
              <p><strong>What's next?</strong></p>
              <p>Return to the app to start posting properties!</p>
            </div>
            <button onclick="closeWindow()">Close Window</button>
          </div>
          <script>
            function closeWindow() {
              // Try to close the window
              window.close();
              
              // If window.close() doesn't work, show a message
              setTimeout(() => {
                document.querySelector('.container').innerHTML = 
                  '<h2>You can now close this window</h2><p>Return to the app to continue</p>';
              }, 100);
            }
            
            // Auto-close after 5 seconds
            setTimeout(() => {
              closeWindow();
            }, 5000);
          </script>
        </body>
      </html>
    `);
  }

  @Get('cancel')
  handleCancel(@Query('session_id') sessionId: string, @Res() res: Response) {
    console.log('❌ Payment cancelled:', sessionId);
    
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment Cancelled</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            }
            .container {
              text-align: center;
              background: white;
              padding: 3rem;
              border-radius: 20px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              max-width: 400px;
            }
            .icon {
              width: 80px;
              height: 80px;
              background: #ef4444;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 2rem;
              position: relative;
            }
            .icon:before, .icon:after {
              content: '';
              position: absolute;
              width: 40px;
              height: 4px;
              background: white;
              border-radius: 2px;
            }
            .icon:before {
              transform: rotate(45deg);
            }
            .icon:after {
              transform: rotate(-45deg);
            }
            h1 {
              color: #1f2937;
              margin: 0 0 1rem;
              font-size: 2rem;
            }
            p {
              color: #6b7280;
              margin: 0 0 2rem;
              font-size: 1.1rem;
            }
            button {
              background: #ef4444;
              color: white;
              border: none;
              padding: 1rem 2rem;
              border-radius: 10px;
              font-size: 1rem;
              font-weight: 600;
              cursor: pointer;
              transition: background 0.3s;
            }
            button:hover {
              background: #dc2626;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon"></div>
            <h1>Payment Cancelled</h1>
            <p>You can return to the app and try again when you're ready.</p>
            <button onclick="closeWindow()">Close Window</button>
          </div>
          <script>
            function closeWindow() {
              window.close();
              setTimeout(() => {
                document.querySelector('.container').innerHTML = 
                  '<h2>You can now close this window</h2><p>Return to the app</p>';
              }, 100);
            }
            setTimeout(() => closeWindow(), 3000);
          </script>
        </body>
      </html>
    `);
  }
}
