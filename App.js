// import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
	Animated,
	Image,
	PanResponder,
	Text,
	View,
	StyleSheet,
	TouchableWithoutFeedback,
	useWindowDimensions
} from 'react-native';
import { Icon } from 'react-native-elements';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import RNFetchBlob from 'rn-fetch-blob';

export default function App() {
	const [prediction, setPrediction] = React.useState(null);
	const [resultImage, setResultImage] = React.useState(null);
	const [form, setForm] = React.useState(null);
	const [dimensions, setDimensions] = React.useState(null);

	const [start, setStart] = React.useState({ x: 0, y: 0 });
	const [end, setEnd] = React.useState({ x: 0, y: 0 });
	
	const imageWidth = 300, imageHeight = 300;
	const { width, height } = useWindowDimensions();
	
	function vw(
		percentageWidth = 100
		// , { subtractPx = 0, addPx = 0 } = {}
	) {
		return (width * percentageWidth) / 100;
		// return (width * percentageWidth / 100) - subtractPx + addPx;
	}
	function vh(
		percentageHeight = 100
		// , { subtractPx = 0, addPx = 0 } = {}
	) {
		return (height * percentageHeight) / 100;
		// return (height * percentageHeight / 100) - subtractPx + addPx;
	}
	
	const panResponder = React.useRef(
		PanResponder.create({
			onMoveShouldSetPanResponder: () => true,
			onStartShouldSetPanResponder: () => true,
			onPanResponderStart: (e) => {
				setStart({ x: e.nativeEvent.locationX, y: e.nativeEvent.locationY });
				setEnd({ x: e.nativeEvent.locationX, y: e.nativeEvent.locationY });
			},
			onPanResponderMove: (e) => {
				setEnd({ x: e.nativeEvent.locationX, y: e.nativeEvent.locationY });
			},
			onPanResponderRelease: (e) => {
				setEnd({ x: e.nativeEvent.locationX, y: e.nativeEvent.locationY });
			}
		})).current;

	function boxAttr(start, end, returnJson = false) {
		start.x = start.x < 0 ? 0 : start.x;
		start.y = start.y < 0 ? 0 : start.y;
		end.x = end.x < 0 ? 0 : end.x;
		end.y = end.y < 0 ? 0 : end.y;

		start.x = start.x > imageWidth ? imageWidth : start.x;
		start.y = start.y > imageHeight ? imageHeight : start.y;
		end.x = end.x > imageWidth ? imageWidth : end.x;
		end.y = end.y > imageHeight ? imageHeight : end.y;

		if (returnJson) {
			if (!dimensions || (start.x === 0 && start.y === 0 && end.x === 0 && end.y === 0)) {
				return {};
			}
			const scaledStart = {
				x: start.x / imageWidth * dimensions.width,
				y: start.y / imageHeight * dimensions.height
			};
			const scaledEnd = {
				x: end.x / imageWidth * dimensions.width,
				y: end.y / imageHeight * dimensions.height
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
	
	function setImage(response) {
		if (response.didCancel || response.error) {
			setForm(null);
			setPrediction(null);
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
		setPrediction(null);
		setResultImage(null);
		setStart({ x: 0, y: 0 });
		setEnd({ x: 0, y: 0 });
	}
	
	function predict() {
		setPrediction(null);
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
			getPrediction(JSON.stringify(result));
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
	}
	
	function getPrediction(result) {
		if (result) {
			const resultDict = JSON.parse(result)["result"];
			
			const sortedResultDict = resultDict.sort((a, b) => {
				return a.xmin - b.xmin;
			});
			
			const digits = sortedResultDict.map((item) => {
				return item.name;
			});
			setPrediction(digits);
		}
	}

	return (
		<View style={styles.container()}>
			<View style={styles.imageButtonBox(!form)}>
				<TouchableWithoutFeedback
					onPress={() => {
						launchImageLibrary({}, (response) => {
							setImage(response);
						});
					}}>
					<View style={styles.imageButton}>
						<Icon name="photo-library" type="material" color="black" size={50} />
						<Text>Pick image</Text>
					</View>
				</TouchableWithoutFeedback>
				<TouchableWithoutFeedback
					onPress={() => {
						launchCamera({}, (response) => {
							setImage(response);
						});
					}}>
					<View style={styles.imageButton}>
						<Icon name="photo-camera" type="material" color="black" size={50} />
						<Text>Take photo</Text>
					
					</View>
				</TouchableWithoutFeedback>
			</View>

			<View style={{
				width: '100%',
				height: '100%',
				flex: 1,
				display: form ? 'flex' : 'none',
				alignItems: "center",
				justifyContent: "center",
			}}>
				<View style={{
					width: imageWidth,
					height: imageHeight,
					zIndex: 3,
					position: "absolute",
					marginVertical: "auto",
				}}>
					<Animated.View
						{...panResponder.panHandlers}
					>
						<View style={{
							height: imageHeight,
							width: imageWidth,
							backgroundColor: "transparent"
						}} />
					</Animated.View>
				</View>
				
				{form && !prediction && 
					<View
						style={{
							width: imageWidth,
							height: imageHeight,
							position: "absolute",
							marginVertical: "auto",
						}}>
						<Animated.View
							style={[
								boxAttr(start, end, false),
								{
									position: 'absolute',
									zIndex: 2,
									backgroundColor: "black",
									opacity: 0.5,
								}
							]}
						/>
						<Image
							source={{
								uri: form.getParts().find(item => item.fieldName === 'file').uri,
							}}
							resizeMode="cover"
							style={{
								width: imageWidth,
								height: imageHeight
							}}
						/>
					</View>
				}
			</View>
				
			{form && !prediction &&
				<View
					style={{
						display: "flex",
						flexDirection: "row",
						justifyContent: "space-between",
					}}>
					<TouchableWithoutFeedback
						onPress={() => {
							setForm(null);
							setPrediction(null);
							setResultImage(null);
							setDimensions(null);
							setStart({ x: 0, y: 0 });
							setEnd({ x: 0, y: 0 });
						}}>
						<View
							style={[
								{
									width: vw(45),
									borderColor: "#330963",
									borderWidth: 1,
								},
								styles.buttton,
							]}>
							<Text style={{
								color: "#330963",
								fontSize: vw(5),
							}}>
								Cancel</Text>
						</View>
					</TouchableWithoutFeedback>
					<TouchableWithoutFeedback
						onPress={() => {
							predict();
						}}>
						<View
							style={[
								{
									width: vw(45),
									backgroundColor: "#330963",
								},
								styles.buttton,
							]}>
							<Text style={{
								color: "white",
								fontSize: vw(5),
							}}>
								Predict</Text>
						</View>
					</TouchableWithoutFeedback>
				</View>
			}
			{resultImage &&
				<View style={{
					width: '100%',
					height: '100%',
					paddingTop: vh(20),
					alignItems: "center",
					justifyContent: "space-between",
				}}>
					<Image
						source={{
							uri: resultImage,
						}}
						resizeMode="cover"
						style={{
							width: imageWidth,
							height: imageHeight
						}}
					/>
					<Text style={{
						fontSize: vw(5),
					}}>
						{"Prediction: " + prediction.map(item => item).join("")}
					</Text>
					<TouchableWithoutFeedback
						onPress={() => {
							setForm(null);
							setPrediction(null);
							setResultImage(null);
							setDimensions(null);
							setStart({ x: 0, y: 0 });
							setEnd({ x: 0, y: 0 });
						}}>
						<View
							style={[
								{
									width: vw(90),
									backgroundColor: "#330963",
								},
								styles.buttton,
							]}>
							<Text style={{
								color: "#fff",
								fontSize: vw(5),
							}}>
								Close</Text>
						</View>
					</TouchableWithoutFeedback>
				</View>
			}
		</View>
	);
}

const styles = StyleSheet.create({
	container: () => {
		return {
			width: "100%",
			height: "100%",
			display: "flex",
			padding: 10,
			alignItems: "center",
			justifyContent: "center",
			backgroundColor: '#f8f8f8',
		};
	},
	
	imageButtonBox: (visible) => {
		const display = visible ? "flex" : "none";
		return {
			width: "100%",
			height: "100%",
			display: display,
			alignItems: "center",
			justifyContent: "center",
		};
	},
	
	imageButton: {
		// width: "80%",
		// height: "20%",
		marginTop: "10%",
		paddingHorizontal: "30%",
		paddingVertical: "15%",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: '#fff',
		borderRadius: 10,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.8,
		shadowRadius: 2,
		elevation: 5,
	},
	
	buttton: {
		padding: 10,
		display: "flex",
		alignItems: "center",
		margin: 10,
		borderRadius: 15,
	}
});
