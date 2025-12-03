// Web-specific implementation
import 'dart:html' as html;

void openPaymentUrlWeb(String url) {
  html.window.open(url, '_blank');
}
