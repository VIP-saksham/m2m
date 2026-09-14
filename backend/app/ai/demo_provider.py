from app.ai.base import BaseAIProvider

class DemoProvider(BaseAIProvider):
    def analyze_image(self, image_path):
        return {'maturity': 'medium', 'quality_grade': 'B'}

