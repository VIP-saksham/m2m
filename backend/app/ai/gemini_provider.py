from app.ai.base import BaseAIProvider

class GeminiProvider(BaseAIProvider):
    def analyze_image(self, image_path):
        return {'maturity': 'high', 'quality_grade': 'A'}

