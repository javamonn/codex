import { AudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { View, Pressable, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export const AssetAudioPlayerControls: React.FC<{
  audioPlayer: AudioPlayer;
}> = ({ audioPlayer }) => {
  const playerStatus = useAudioPlayerStatus(audioPlayer);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleSeek = (event: any) => {
    const { locationX, currentTarget } = event.nativeEvent;
    const progress = locationX / currentTarget.offsetWidth;
    const seekTime = progress * playerStatus.duration;
    audioPlayer.seekTo(seekTime);
  };

  return (
    <View style={styles.container}>
      {/* Main Controls */}
      <View style={styles.mainControls}>
        <Pressable
          onPress={() =>
            audioPlayer.seekTo(Math.max(0, playerStatus.currentTime - 15))
          }
          style={styles.skipButton}
        >
          <Ionicons name="play-back" size={24} color="#000" />
          <Text style={styles.skipText}>15</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            if (playerStatus.playing) {
              audioPlayer.pause();
            } else {
              audioPlayer.play();
            }
          }}
          style={styles.playButton}
        >
          <Ionicons
            name={playerStatus.playing ? "pause" : "play"}
            size={40}
            color="#000"
          />
        </Pressable>

        <Pressable
          onPress={() =>
            audioPlayer.seekTo(
              Math.min(playerStatus.duration, playerStatus.currentTime + 15)
            )
          }
          style={styles.skipButton}
        >
          <Ionicons name="play-forward" size={24} color="#000" />
          <Text style={styles.skipText}>15</Text>
        </Pressable>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <Pressable onPress={handleSeek} style={styles.progressBar}>
          <View
            style={[
              styles.progress,
              {
                width: `${
                  (playerStatus.currentTime / playerStatus.duration) * 100
                }%`,
              },
            ]}
          />
        </Pressable>

        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>
            {formatTime(playerStatus.currentTime)}
          </Text>
          <Text style={styles.timeText}>
            {formatTime(playerStatus.duration)}
          </Text>
        </View>
      </View>

      {/* Playback Speed */}
      <View style={styles.speedControls}>
        <Pressable
          onPress={() => {
            const speeds = [0.5, 1, 1.25, 1.5, 2];
            const currentIndex = speeds.indexOf(playerStatus.playbackRate);
            const nextIndex = (currentIndex + 1) % speeds.length;
            audioPlayer.setPlaybackRate(speeds[nextIndex]);
          }}
          style={styles.speedButton}
        >
          <Text style={styles.timeText}>{playerStatus.playbackRate}x</Text>
        </Pressable>
      </View>

      {/* Loading Indicator */}
      {playerStatus.isBuffering && (
        <View style={styles.bufferingOverlay}>
          <Text style={styles.loadingText}>Buffering...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    width: "100%",
  },
  mainControls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  playButton: {
    padding: 16,
    marginHorizontal: 32,
  },
  skipButton: {
    alignItems: "center",
  },
  timeText: {
    fontSize: 14,
  },
  loadingText: {
    fontSize: 14,
  },
  skipText: {
    fontSize: 12,
    marginTop: 4,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    overflow: "hidden",
  },
  progress: {
    height: "100%",
    backgroundColor: "#000",
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  speedControls: {
    alignItems: "center",
    marginTop: 8,
  },
  speedButton: {
    padding: 8,
    backgroundColor: "#F0F0F0",
    borderRadius: 4,
  },
  bufferingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
});
