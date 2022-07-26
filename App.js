// import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
	Animated, Button, Image, PanResponder, ScrollView, StyleSheet,
	Text,
	View
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import RNFetchBlob from 'rn-fetch-blob';

// import RNTextDetector from 'rn-text-detector';
// import TesseractOcr, {
//   LANG_ENGLISH,
// } from 'react-native-tesseract-ocr';
// import TextRecognition from 'react-native-text-recognition';
// import { RNCamera } from 'react-native-camera';
// import MlkitOcr from 'react-native-mlkit-ocr';

export default function App() {
	const [result, setResult] = React.useState(null);
	const [resultImage, setResultImage] = React.useState(null);
	const [form, setForm] = React.useState(null);
	const [dimensions, setDimensions] = React.useState(null);
	// const offset = useSharedValue({ x: 0, y: 0 });

	// const dragGesture = Gesture.Pan()
	// 	.onUpdate((e) => {
	// 		console.log('start');
	// 		test.value = e.translationX;
	// 		// offset.value = {
	// 		// 	x: e.translationX,
	// 		// 	y: e.translationY
	// 		// };
	// 	});

	// const animatedStyles = useAnimatedStyle(() => {
	// 	return {
	// 		// transform: [{ translateX: offset.value.x }, { translateY: offset.value.y }],
	// 		transform: [{ translateX: test.value}]
	// 	};
	// });

	const [start, setStart] = React.useState({ x: 0, y: 0 });
	const [end, setEnd] = React.useState({ x: 0, y: 0 });
	// const start = React.useRef(new Animated.ValueXY({x: 0, y: 0}));
	// const end = React.useRef(new Animated.ValueXY({ x: 200, y: 200 }));

	// const start = React.useRef(new Animated.ValueXY()).current;
	// const end = React.useRef(new Animated.ValueXY()).current;
	const panResponder = React.useRef(
		PanResponder.create({
			onMoveShouldSetPanResponder: () => true,
			onStartShouldSetPanResponder: () => true,
			onPanResponderStart: (e, gestureState) => {
				// start.setValue({ x: e.nativeEvent.locationX, y: e.nativeEvent.locationY });
				// end.setValue({ x: e.nativeEvent.locationX, y: e.nativeEvent.locationY });
				setStart({ x: e.nativeEvent.locationX, y: e.nativeEvent.locationY });
				setEnd({ x: e.nativeEvent.locationX, y: e.nativeEvent.locationY });
			},
			onPanResponderMove: (e) => {
				setEnd({ x: e.nativeEvent.locationX, y: e.nativeEvent.locationY });
				// end.setValue({ x: e.nativeEvent.locationX, y: e.nativeEvent.locationY });
				// Animated.event(
				// 	[
				// 		{
				// 			nativeEvent: {
				// 				translationX: pan.x,
				// 				translationY: pan.y
				// 			}
				// 		}
				// 	],
				// 	{ useNativeDriver: true }
				// );
			},
			onPanResponderRelease: (e) => {
				// end.setValue({ x: e.nativeEvent.locationX, y: e.nativeEvent.locationY });
				setEnd({ x: e.nativeEvent.locationX, y: e.nativeEvent.locationY });
			}
		},

		)).current;
	// pan.addListener(({ x, y }) => {
	// 	console.log(x, y);
	// });

	// function ip(value) {
	// 	return value.interpolate({
	// 		inputRange: [0, 200],
	// 		outputRange: [0, 200],
	// 		extrapolate: 'clamp'
	// 	});
	// }

	function boxAttr(start, end, returnJson = false) {
		start.x = start.x < 0 ? 0 : start.x;
		start.y = start.y < 0 ? 0 : start.y;
		end.x = end.x < 0 ? 0 : end.x;
		end.y = end.y < 0 ? 0 : end.y;

		start.x = start.x > 200 ? 200 : start.x;
		start.y = start.y > 200 ? 200 : start.y;
		end.x = end.x > 200 ? 200 : end.x;
		end.y = end.y > 200 ? 200 : end.y;

		if (returnJson) {
			if (!dimensions || (start.x === 0 && start.y === 0 && end.x === 0 && end.y === 0)) {
				return {};
			}
			const scaledStart = {
				x: start.x / 200 * dimensions.width,
				y: start.y / 200 * dimensions.height
			};
			const scaledEnd = {
				x: end.x / 200 * dimensions.width,
				y: end.y / 200 * dimensions.height
			};

			return {
				unit: 'px',
				x: scaledStart.x > scaledEnd.x ? scaledEnd.x : scaledStart.x,
				y: scaledStart.y > scaledEnd.y ? scaledEnd.y : scaledStart.y,
				width: Math.abs(scaledStart.x - scaledEnd.x),
				height: Math.abs(scaledStart.y - scaledEnd.y)
			}
		} else {
			return {
				left: start.x > end.x ? end.x : start.x,
				top: start.y > end.y ? end.y : start.y,
				width: Math.abs(end.x - start.x),
				height: Math.abs(end.y - start.y),
			};
		}
	}

	return (
		<ScrollView>
			<View style={styles.container}>
				<Text>Ocr Demo</Text>
				<Button
					title="Pick image"
					onPress={() => {
						launchImageLibrary({}, (response) => {
							if (response.didCancel || response.error) {
								setForm(null);
								setResult(null);
								setResultImage(null);
								setDimensions(null);
								setStart({ x: 0, y: 0 });
								setEnd({ x: 0, y: 0 });
								return;
							}
							const temp = new FormData();
							temp.append("file", {
								name: response.assets[0].fileName,
								type: response.assets[0].type,
								uri: response.assets[0].uri,
							});
							setDimensions({
								width: response.assets[0].width,
								height: response.assets[0].height,
							});
							setForm(temp);
							setResult(null);
							setResultImage(null);
							setStart({ x: 0, y: 0 });
							setEnd({ x: 0, y: 0 });
						});
					}}
				/>

				{/* <Animated.View style={{
						// position: 'absolute',
							width: 200,
							height: 200,
							backgroundColor: 'grey',
						}}>
					<GestureDetector gesture={dragGesture}>
								<View
									style={[animatedStyles, {
										// position: 'absolute',
										width: "30%",
										height: "30%",
										backgroundColor: 'red',
									}]}
									// style={{
										// 	position: 'absolute',
										// 	zIndex: 2,
										// 	// get the coordinates of the box
										// 	// left: start.current.x,
										// 	// top: start.current.y,
										// 	// width: end.current.x - start.current.x,
										// 	// height: end.current.y - start.current.y,
										// 	backgroundColor: "red",
										// }}
										/>
							</GestureDetector>
				</Animated.View> */}

				<View style={{
					flex: 1,
					alignItems: "center",
					justifyContent: "center",
					width: 200,
					height: 200,
					zIndex: 3,
					// backgroundColor: "red",
				}}>
					<Animated.View
						style={{
							// transform: [{ translateX: pan.x }, { translateY: pan.y }],
						}}
						{...panResponder.panHandlers}
					>
						<View style={{
							height: 200,
							width: 200,
							backgroundColor: "transparent"
						}} />
					</Animated.View>
				</View>

				{form && <Text>{form.getParts().find(item => item.fieldName === 'file').name}</Text>}
				{form &&
					<View
						// onStartShouldSetResponder={() => true}
						// onResponderGrant={(e) => {
						// 	setStart({ x: e.nativeEvent.locationX, y: e.nativeEvent.locationY });
						// 	setEnd({ x: e.nativeEvent.locationX, y: e.nativeEvent.locationY });
						// }}
						// onTouchMove={(e) => {
						// setEnd({ x: e.nativeEvent.locationX, y: e.nativeEvent.locationY });
						// Animated.event([
						// 	null,
						// 	{ dx: pan.x, dy: pan.y }
						// ], { useNativeDriver: true });
						// }}
						// onResponderMove={(e) => {
						// 	setEnd({ x: e.nativeEvent.locationX, y: e.nativeEvent.locationY });
						// }}
						// onResponderRelease={(e) => {
						// 	setEnd({ x: e.nativeEvent.locationX, y: e.nativeEvent.locationY });
						// }}
						style={{
							width: 200,
							height: 200,
							position: "absolute",
							top: 70,
						}}

					>
						<Animated.View
							style={[
								boxAttr(start, end, false),
								{
									position: 'absolute',
									zIndex: 2,
									// left: end.x,
									// top: end.y,

									// left: ip(start.x) > ip(end.x) ? ip(end.x) : ip(start.x),
									// top: ip(start.y) > ip(end.y) ? ip(end.y) : ip(start.y),

									// left: start.x > end.x ? end.x : start.x,
									// top: start.y > end.y ? end.y : start.y,
									// width: Math.abs(end.x - start.x),
									// height: Math.abs(end.y - start.y),

									// transform: [
									// 	{ translateX: start.x },
									// 	{ translateY: start.y },
									// 	{ scale: scale },
									// ],
									// width: "10%",
									// height: "10%",
									backgroundColor: "black",
									opacity: 0.5,
								}
							]}
						/>
						<Image
							source={{
								uri: form.getParts().find(item => item.fieldName === 'file').uri,
							}}
							resizeMode="contain"
							style={{ width: 200, height: 200 }}
						/>
					</View>
				}
				{/* <Text>{"start: " + start.x.toPrecision(4) + " : " + start.y.toPrecision(4)}</Text>
				<Text>{"end: " + end.x.toPrecision(4) + " : " + end.y.toPrecision(4)}</Text> */}
				<Text>
					{"x: " + (start.x > end.x ? end.x : start.x).toPrecision(2)
						+ " y: " + (start.y > end.y ? end.y : start.y).toPrecision(2)}
				</Text>
				<Text>
					{"w: " + Math.abs(end.x - start.x).toPrecision(2)
						+ " h: " + Math.abs(end.y - start.y).toPrecision(2)}
				</Text>
				{/* <Text>
					{(boxAttr(start, end, true).x) ? "true" : "false" + " " + start.x}
				</Text>
				<Button title="Submit" onPress={() => {
					console.log(JSON.stringify(boxAttr(start, end, true)));
				}}
				/> */}
				
				{form &&
					<Button
						title="Predict"
						onPress={() => {
							setResult(null);
							setResultImage(null);
							
							let temp = form;
							const attr = boxAttr(start, end, true);								
							if (attr.x) {
								temp.append("crop", JSON.stringify(attr));
							}
							
							fetch("http://localhost:8000/object-to-json", {
								method: "POST",
								body: temp,
							}).then(async (response) => {
								const result = await response.json();
								setResult(JSON.stringify(result, null, 2));
							}).catch((error) => {
								console.log(error);
							});
							
							let imgRequest = [];
							imgRequest.push({
								name: 'file',
								filename: form.getParts().find(item => item.fieldName === 'file').name,
								data: RNFetchBlob.wrap(form.getParts().find(item => item.fieldName === 'file').uri)
							});
							if (attr.x) {
								imgRequest.push({
									name: 'crop',
									data: (attr.x) ? JSON.stringify(attr) : null,
								});
							}
							RNFetchBlob
								.config({
									fileCache: true,
									appendExt: form.getParts().find(item => item.fieldName === 'file').name.split('.').pop(),
								})
								.fetch('POST', 'http://localhost:8000/object-to-img', {},imgRequest)
								.then(async (res) => {
									setResultImage("file://" + res.path());
								})
								.catch((err) => {
									console.log(err);
								});
						}}
					/>
				}
				{resultImage &&
					<Image
						source={{
							uri: resultImage,
						}}
						resizeMode="contain"
						style={{
							width: 200,
							height: 200
						}}
					/>}
				{/* {result && <Text>{resultImage}</Text>} */}
				{result && <Text>{result}</Text>}
				{/* <Button
					title="Launch Camera"
					onPress={() => {
						launchCamera({}, async (response) => {
							const rnText = await RNTextDetector.detectFromUri(response.assets[0].uri);
							// const tesseract = await TesseractOcr.recognize(response.assets[0].uri, LANG_ENGLISH, {});
							const textRecog = await TextRecognition.recognize(response.assets[0].uri);
							// const resultFromUri = await MlkitOcr.detectFromUri(uri);
					
							console.log(rnText);
							console.log(textRecog);
							// console.log(resultFromUri);
					
							// RNTextDetector.detectFromUri(response.assets[0].uri, (textRecognition) => {
							// 	console.log(textRecognition);
							// 	// setState({ ...state, loading: false, image: response.uri, textRecognition });
							// });
						});
				}} /> */}
				{/* <Text>{ state.textRecognition }</Text> */}
				{/* <RNCamera
					onTextRecognized={(textRecognition) => {
						console.log(textRecognition);
					}}
				></RNCamera> */}
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		width: "100%",
		flex: 1,
		padding: 10,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#fff',
	},
});
