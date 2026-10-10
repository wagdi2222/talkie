"""Record every fixed Talkie sentence as an mp3 clip, for devices without an English voice (e.g. Huawei/HarmonyOS).

Usage (from the repository root, with the site served locally):
    python3 -m http.server 8790 &
    python3 tools/build_audio.py --model path/to/en-us-libritts-high.onnx --speaker 12 --site http://localhost:8790/index.html

Needs: pip install piper-tts playwright numpy ; ffmpeg on PATH.
Voice: Piper "en-us-libritts-high" (LibriTTS, CC BY 4.0). Only new or changed sentences are synthesised;
clips no longer used are removed. The phrase list comes from window.TALKIE_PHRASES in the app itself.
"""
import argparse, asyncio, io, json, os, subprocess, wave
import numpy as np
from piper import PiperVoice, SynthesisConfig
from playwright.async_api import async_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'audio')

COLLECT = """() => {
  const clips=new Map(), exact=new Map();
  (window.TALKIE_PHRASES||[]).forEach(f=>{ let arr=[]; try{ arr=f()||[]; }catch(e){ console.error('phrase list failed', e); }
    arr.forEach(x=>{ const o=typeof x==='string'?{t:x}:x; const k=vnorm(o.t); if(!k) return; const m=o.exact?exact:clips; if(!m.has(k)) m.set(k, o.s||o.t); }); });
  return {clips:[...clips].map(([k,s])=>[k,s,vhash(k)]), exact:[...exact].map(([k,s])=>[k,s,vhash('#'+k)])};
}"""

async def collect(site):
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page()
        await pg.goto(site)
        await pg.wait_for_timeout(1500)
        data = await pg.evaluate(COLLECT)
        await b.close()
    return data

def expected_seconds(text):
    return 0.075 * sum(c.isalpha() for c in text) + 0.15

def render(voice, speaker, text, ls):
    buf = io.BytesIO()
    with wave.open(buf, 'wb') as w:
        voice.synthesize_wav(text, w, syn_config=SynthesisConfig(speaker_id=speaker, length_scale=ls))
    buf.seek(0)
    with wave.open(buf) as r:
        return r.getframerate(), np.frombuffer(r.readframes(r.getnframes()), dtype=np.int16)

def synth(voice, speaker, text, path, base=1.05):
    # without closing punctuation the model swallows short words ("Bye" -> a blip)
    if text and text[-1] not in '.!?':
        text = text + '.'
    # the model sometimes rushes very short phrases ("Bye"); slow those down until they reach a natural length
    sr, a = render(voice, speaker, text, base)
    for ls in (base + 0.3, base + 0.6, base + 0.95):
        if len(a) / sr >= 0.62 * expected_seconds(text): break
        sr, a = render(voice, speaker, text, ls)
    # trim leading/trailing silence, keep a short natural pad
    env = np.abs(a.astype(np.float32)); thr = max(250.0, env.max() * 0.02)
    idx = np.where(env > thr)[0]
    if len(idx):
        pad = int(sr * 0.06); a = a[max(0, idx[0] - pad): min(len(a), idx[-1] + pad)]
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 's16le', '-ar', str(sr), '-ac', '1', '-i', '-',
                    '-b:a', '40k', '-ar', '22050', path], input=a.tobytes(), check=True)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--model', required=True); ap.add_argument('--speaker', type=int, default=12)
    ap.add_argument('--site', default='http://localhost:8790/index.html')
    a = ap.parse_args()
    data = asyncio.run(collect(a.site))
    os.makedirs(OUT, exist_ok=True)
    voice = PiperVoice.load(a.model)
    manifest = {'v': 1, 'voice': 'Piper en-us-libritts-high, speaker %d' % a.speaker,
                'license': 'Voice model trained on LibriTTS (CC BY 4.0, Zen et al. 2019); Piper TTS (MIT).', 'clips': {}, 'exact': {}}
    try:
        prev_text = json.load(open(os.path.join(OUT, 'sources.json')))
    except Exception:
        prev_text = {}
    texts, made = {}, 0
    for group in ('clips', 'exact'):
        for key, text, cid in data[group]:
            path = os.path.join(OUT, cid + '.mp3')
            if not os.path.exists(path) or prev_text.get(cid) != text:
                synth(voice, a.speaker, text, path, 1.4 if group == 'exact' else 1.05); made += 1   # letter names a little slower for children
            manifest[group][key] = cid; texts[cid] = text
    json.dump(texts, open(os.path.join(OUT, 'sources.json'), 'w'), ensure_ascii=False, indent=0)
    keep = set(texts)
    for f in os.listdir(OUT):
        if f.endswith('.mp3') and f[:-4] not in keep:
            os.remove(os.path.join(OUT, f))
    json.dump(manifest, open(os.path.join(OUT, 'index.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
    total = len(data['clips']) + len(data['exact'])
    size = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT))
    print(f'{total} clips ({made} new), {size/1e6:.1f} MB')

if __name__ == '__main__':
    main()
