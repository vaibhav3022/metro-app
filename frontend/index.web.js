import { AppRegistry } from 'react-native';
import App from './App';
// Import gesture handler to ensure gesture support works on web if needed
import 'react-native-gesture-handler';

// Inject vector icons style if the font-face method isn't enough, but it should be fine.
// Some libraries might require this specifically:
import MaterialIcons from 'react-native-vector-icons/Fonts/MaterialIcons.ttf';
import FontAwesome from 'react-native-vector-icons/Fonts/FontAwesome.ttf';
import Ionicons from 'react-native-vector-icons/Fonts/Ionicons.ttf';
import FontAwesome5_Solid from 'react-native-vector-icons/Fonts/FontAwesome5_Solid.ttf';

const iconFontStyles = `@font-face {
  src: url(${MaterialIcons});
  font-family: MaterialIcons;
}
@font-face {
  src: url(${FontAwesome});
  font-family: FontAwesome;
}
@font-face {
  src: url(${Ionicons});
  font-family: Ionicons;
}
@font-face {
  src: url(${FontAwesome5_Solid});
  font-family: FontAwesome5_Solid;
}`;

// Create stylesheet for fonts
const style = document.createElement('style');
style.type = 'text/css';
if (style.styleSheet) {
  style.styleSheet.cssText = iconFontStyles;
} else {
  style.appendChild(document.createTextNode(iconFontStyles));
}
document.head.appendChild(style);


AppRegistry.registerComponent('HelloWorld', () => App);
AppRegistry.runApplication('HelloWorld', {
  initialProps: {},
  rootTag: document.getElementById('root'),
});
