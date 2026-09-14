from app.models.assessment import Assessment
from app.models.batch import ProduceBatch
from app import db
import os
import random


def _image_signals(image_path):
    try:
        import cv2
        import numpy as np
        image = cv2.imread(image_path)
        if image is None:
            return None
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        brightness = float(np.mean(hsv[:, :, 2]))
        edges = cv2.Canny(image, 80, 160)
        defect_ratio = float(np.mean(edges > 0) * 100)
        try:
            import torch
            tensor_mean = float((torch.from_numpy(image).float() / 255.0).mean().item())
        except ImportError:
            tensor_mean = brightness / 255.0
        return {'brightness': round(brightness, 2), 'edge_ratio': round(defect_ratio, 2), 'tensor_mean': round(tensor_mean, 4)}
    except (ImportError, ValueError, OSError):
        return None


class AssessmentService:
    def run(self, batch_id, image_path=None):
        batch = ProduceBatch.query.get(batch_id)
        if not batch:
            return None
        if image_path and os.path.exists(image_path):
            signals = _image_signals(image_path)
            if signals:
                return self._image_assess(batch, image_path, signals)
        return self._demo_assess(batch, image_path)

    def _image_assess(self, batch, image_path, signals):
        assessment = Assessment.query.filter_by(batch_id=batch.id).first()
        if not assessment:
            assessment = Assessment(batch_id=batch.id)
            db.session.add(assessment)
        brightness = signals['brightness']
        defect_ratio = signals['edge_ratio']
        grade = 'A' if brightness >= 105 and defect_ratio < 18 else ('B' if brightness >= 75 and defect_ratio < 30 else 'C')
        risk = 'high' if defect_ratio >= 30 or brightness < 55 else ('medium' if defect_ratio >= 18 else 'low')
        maturity = 'high' if brightness >= 110 else ('medium' if brightness >= 70 else 'low')
        sell_days = 2 if risk == 'high' else (5 if risk == 'medium' else 10)
        base_price = {'A': 32, 'B': 26, 'C': 19}[grade]
        assessment.image_path = image_path
        assessment.maturity = maturity
        assessment.visible_defects = f'Estimated visual defect signal {defect_ratio:.1f}%'
        assessment.appearance = 'good' if grade == 'A' else ('fair' if grade == 'B' else 'needs review')
        assessment.quality_grade = grade
        assessment.spoilage_risk = risk
        assessment.confidence = 0.55 if grade == 'C' else 0.68
        assessment.assessment_method = 'opencv_torch_heuristic'
        assessment.color_score = round(min(100, brightness / 2.55), 2)
        assessment.texture_score = round(max(0, 100 - defect_ratio * 1.5), 2)
        assessment.defect_percentage = defect_ratio
        assessment.ai_raw_response = {'vision_signals': signals, 'prediction': {
            'sell_window_days': sell_days, 'estimated_price_min': max(0, base_price - 4),
            'estimated_price_max': base_price + 4, 'currency': 'INR', 'unit': batch.unit or 'kg',
        }}
        assessment.notes = 'Image estimate from OpenCV visual signals and PyTorch tensor preprocessing. Verify locally before sale.'
        assessment.is_demo = False
        batch.status = 'assessment_complete'
        db.session.commit()
        return assessment.to_dict()

    def _demo_assess(self, batch, image_path):
        assessment = Assessment.query.filter_by(batch_id=batch.id).first()
        if not assessment:
            assessment = Assessment(batch_id=batch.id)
            db.session.add(assessment)
        assessment.image_path = image_path or batch.image_path
        assessment.maturity = batch.maturity_level or 'medium'
        assessment.visible_defects = batch.visible_defects or 'none'
        assessment.quality_grade = batch.initial_quality_estimate or 'B'
        assessment.spoilage_risk = 'high' if batch.spoilage_signs and len(batch.spoilage_signs) > 5 else 'low'
        assessment.appearance = 'good'
        assessment.confidence = 0.70
        assessment.assessment_method = 'demo'
        assessment.color_score = round(random.uniform(70.0, 95.0), 2)
        assessment.texture_score = round(random.uniform(70.0, 95.0), 2)
        assessment.defect_percentage = round(random.uniform(1.0, 15.0), 2)
        assessment.is_demo = True
        batch.status = 'assessment_complete'
        db.session.commit()
        return assessment.to_dict()
