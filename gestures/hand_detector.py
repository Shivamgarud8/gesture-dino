import mediapipe as mp
import cv2
import numpy as np

# Initialize MediaPipe Hands with optimized settings
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=1,
    min_detection_confidence=0.6,  # Lower threshold for better detection
    min_tracking_confidence=0.6,
    model_complexity=1
)

def calculate_distance(point1, point2):
    """Calculate Euclidean distance between two points"""
    return np.sqrt((point1[0] - point2[0])**2 + (point1[1] - point2[1])**2)

def detect_fist(frame):
    """
    Detect if hand is making a fist gesture
    Returns: (is_fist, landmarks_list)
    
    IMPROVED - More sensitive fist detection:
    - Lower thresholds
    - Multiple detection methods
    - Better for varying hand positions
    """
    h, w, _ = frame.shape
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    result = hands.process(rgb)
    
    landmarks_list = []
    is_fist = False
    
    if result.multi_hand_landmarks:
        hand = result.multi_hand_landmarks[0]
        
        # Extract all landmarks
        for lm in hand.landmark:
            landmarks_list.append({
                "x": int(lm.x * w),
                "y": int(lm.y * h)
            })
        
        # Key landmarks for fist detection
        wrist = (hand.landmark[0].x, hand.landmark[0].y)
        thumb_tip = (hand.landmark[4].x, hand.landmark[4].y)
        index_tip = (hand.landmark[8].x, hand.landmark[8].y)
        index_pip = (hand.landmark[6].x, hand.landmark[6].y)
        middle_tip = (hand.landmark[12].x, hand.landmark[12].y)
        middle_pip = (hand.landmark[10].x, hand.landmark[10].y)
        ring_tip = (hand.landmark[16].x, hand.landmark[16].y)
        ring_pip = (hand.landmark[14].x, hand.landmark[14].y)
        pinky_tip = (hand.landmark[20].x, hand.landmark[20].y)
        pinky_pip = (hand.landmark[18].x, hand.landmark[18].y)
        palm_center = (hand.landmark[9].x, hand.landmark[9].y)
        
        # Calculate hand size for normalization
        hand_size = calculate_distance(wrist, middle_tip)
        
        if hand_size > 0:
            # Method 1: Check if fingers are folded (MORE SENSITIVE)
            fingers_folded = 0
            
            if index_tip[1] > index_pip[1]:  # Y increases downward
                fingers_folded += 1
            if middle_tip[1] > middle_pip[1]:
                fingers_folded += 1
            if ring_tip[1] > ring_pip[1]:
                fingers_folded += 1
            if pinky_tip[1] > pinky_pip[1]:
                fingers_folded += 1
            
            # Method 2: Check if fingertips are close to palm (LOWER THRESHOLD)
            fingertips_close = 0
            threshold = hand_size * 0.4  # INCREASED from 0.35 - more sensitive
            
            if calculate_distance(index_tip, palm_center) < threshold:
                fingertips_close += 1
            if calculate_distance(middle_tip, palm_center) < threshold:
                fingertips_close += 1
            if calculate_distance(ring_tip, palm_center) < threshold:
                fingertips_close += 1
            if calculate_distance(pinky_tip, palm_center) < threshold:
                fingertips_close += 1
            
            # Method 3: Thumb position
            thumb_tucked = False
            thumb_distance = calculate_distance(thumb_tip, palm_center)
            if thumb_distance < hand_size * 0.35:  # More sensitive
                thumb_tucked = True
            
            # IMPROVED DETECTION - More lenient
            # Fist detected if:
            # - At least 2 fingers folded AND 2 fingertips close, OR
            # - At least 3 fingers folded, OR
            # - Thumb tucked AND at least 2 fingers folded
            if (fingers_folded >= 2 and fingertips_close >= 2) or \
               (fingers_folded >= 3) or \
               (thumb_tucked and fingers_folded >= 2):
                is_fist = True
    
    return is_fist, landmarks_list
