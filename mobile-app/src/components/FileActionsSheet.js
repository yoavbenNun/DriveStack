import React, { useEffect, useRef } from "react";
import { Animated, Modal, Pressable, Text, View } from "react-native";

export default function FileActionsSheet({ 
  visible, item, onClose, onRename, onDelete, onShare, onToggleStar, 
  onOpen, onRemoveAccess
}) {
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slide, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    } else {
      slide.setValue(0);
    }
  }, [visible]);

  const translateY = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [260, 0],
  });

  const isShared = item?.shared === true;

  return (
    <Modal visible={visible} transparent animationType="none">
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" }}>
        <Pressable onPress={() => {}} style={{ width: "100%" }}>
          <Animated.View
            style={{
              transform: [{ translateY }],
              backgroundColor: "white",
              padding: 16,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "700" }} numberOfLines={1}>
              {item?.name || "Actions"}
            </Text>

            <View style={{ height: 10 }} />

            {isShared ? (
              <>
                <ActionRow title="Open" onPress={onOpen} />
                <ActionRow title="Remove Access" danger onPress={onRemoveAccess} />
              </>
            ) : (
              <>
                <ActionRow title="Rename" onPress={onRename} />
                <ActionRow title="Share" onPress={onShare} />
                <ActionRow title={item?.starred ? "Unstar" : "Star"} onPress={onToggleStar} />
                <ActionRow title="Delete" danger onPress={onDelete} />
              </>
            )}

            <View style={{ height: 6 }} />
            <ActionRow title="Cancel" secondary onPress={onClose} />
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ActionRow({ title, onPress, danger, secondary }) {
  return (
    <Pressable onPress={onPress} style={{ paddingVertical: 12 }}>
      <Text style={{ fontSize: 16, color: danger ? "crimson" : secondary ? "gray" : "black" }}>
        {title}
      </Text>
    </Pressable>
  );
}