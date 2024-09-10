import { StyleSheet } from "react-native";
import { WebView, WebViewProps } from "react-native-webview";
import { useState, useEffect } from "react";

import { CountryCode, getOAuthWebviewSource } from "@/services/audible";

export default function Audible() {
  const [source, setSource] = useState<WebViewProps["source"]>(undefined);

  useEffect(() => {
    getOAuthWebviewSource({ countryCode: CountryCode.US }).then((source) => {
      console.log("setting source", source);
      setSource(source);
    });
  }, []);

  return source ? <WebView source={source} style={styles.container} /> : null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
