import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Alert, BackHandler } from 'react-native';
import { WebView } from 'react-native-webview';

const APP_URL = 'https://f26bb11c-218a-4594-bd57-714b53576ecf-00-15rco3z6ir6rr.picard.replit.dev/driver/secure-login';

export default function App() {
  const webViewRef = React.useRef(null);

  // Handle back button for Android
  React.useEffect(() => {
    const onBackPress = () => {
      if (webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    };

    BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
  }, []);

  const onMessage = (event) => {
    const message = event.nativeEvent.data;
    console.log('Message from WebView:', message);
  };

  const onError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.warn('WebView error: ', nativeEvent);
    Alert.alert(
      'خطأ في الاتصال',
      'لم نستطع الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.',
      [{ text: 'حسناً' }]
    );
  };

  const onLoadStart = () => {
    console.log('WebView loading started');
  };

  const onLoadEnd = () => {
    console.log('WebView loading ended');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <WebView
        ref={webViewRef}
        source={{ uri: APP_URL }}
        style={styles.webView}
        onMessage={onMessage}
        onError={onError}
        onLoadStart={onLoadStart}
        onLoadEnd={onLoadEnd}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        allowsBackForwardNavigationGestures={true}
        mixedContentMode="compatibility"
        thirdPartyCookiesEnabled={true}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        originWhitelist={['*']}
        userAgent="AtbaaliCaptainApp/1.0.0 (Android; Mobile App)"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3B82F6',
  },
  webView: {
    flex: 1,
  },
});