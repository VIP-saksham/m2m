import json
from datetime import date
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


def local_guidance(question, batches):
    text = (question or '').lower()
    latest = batches[0] if batches else None
    if latest and latest.get('decision'):
        decision = latest['decision']
        scores = {
            'SELL': decision.get('sell_score') or 0,
            'STORE': decision.get('store_score') or 0,
            'PROCESS': decision.get('process_score') or 0,
        }
        prediction = max(scores, key=scores.get)
        forecast = f"Current batch prediction: {prediction} looks strongest ({scores[prediction]:.0f}/100)."
    else:
        forecast = 'Create a batch and complete its assessment for a crop-specific prediction.'

    if any(word in text for word in ('price', 'दाम', 'कीमत', 'भाव')):
        return f"{forecast} Price should be discussed as a range after checking local mandi rates, quality and transport cost."
    if any(word in text for word in ('sell', 'बेच', 'bech')):
        return f"{forecast} Complete the quality assessment before accepting a buyer offer. The prediction is guidance, not a guaranteed outcome."
    if any(word in text for word in ('store', 'storage', 'भंडार')):
        return f"{forecast} Store only when shelf life, storage condition and expected price justify the waiting cost."
    return f"Namaste! I can help with selling, storage, price range, processor matching and your batch. {forecast}"


def answer(question, batches, config):
    fallback = local_guidance(question, batches)
    api_key = config.get('LLM_API_KEY')
    api_url = config.get('LLM_API_URL')
    model = config.get('LLM_MODEL')
    if not api_key or not api_url or not model:
        return {'answer': fallback, 'source': 'local_prediction'}

    context = json.dumps({'batches': batches[:5], 'today': date.today().isoformat()})
    payload = json.dumps({
        'model': model,
        'messages': [
            {'role': 'system', 'content': 'You are M2M Sahayak, a concise bilingual agricultural marketplace assistant. Give practical, cautious advice. Never guarantee prices, yields, or profits. Use the provided farmer context.'},
            {'role': 'user', 'content': f'Farmer context: {context}\nQuestion: {question}'},
        ],
        'temperature': 0.3,
        'max_tokens': 350,
    }).encode('utf-8')
    request = Request(api_url, data=payload, headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {api_key}'}, method='POST')
    try:
        with urlopen(request, timeout=12) as response:
            body = json.loads(response.read().decode('utf-8'))
        content = body.get('choices', [{}])[0].get('message', {}).get('content')
        if content:
            return {'answer': content.strip(), 'source': 'llm', 'prediction': fallback}
    except (HTTPError, URLError, TimeoutError, ValueError, KeyError):
        pass
    return {'answer': fallback, 'source': 'local_prediction'}
