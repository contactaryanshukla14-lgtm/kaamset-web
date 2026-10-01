"""Create editable Rive pixel characters and PNG previews with the official CLI."""
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
RIVE = Path.home() / '.rive' / 'bin' / 'rive.exe'
PROJECTS = ROOT / 'design' / 'rive-crew'
PUBLIC = ROOT / 'public' / 'crew'

PALETTES = {
    'vijay': {'H':'FF34394D','F':'FFF0BC8D','O':'FF08275A','B':'FF134D9E','C':'FF36D8C0','W':'FFFFFFFF','G':'FFFFD266'},
    'milan': {'H':'FF523D3B','F':'FFF0B88A','O':'FF08275A','B':'FF0A84BD','C':'FF5CE1F2','W':'FFFFFFFF','G':'FFFFD266'},
    'riya': {'H':'FF113565','F':'FFE9AB7F','O':'FF08275A','B':'FF0078D9','C':'FF00B9F1','W':'FFFFFFFF','G':'FFFFD266'},
    'tara': {'H':'FF113565','F':'FFFFC997','O':'FF08275A','B':'FF0078D9','C':'FF5CE1F2','W':'FFFFFFFF','G':'FFFFD266'},
    'milo': {'H':'FF163A64','F':'FFDFAE83','O':'FF08275A','B':'FF134D9E','C':'FF9CEBFA','W':'FFFFFFFF','G':'FFFFCC57'},
    'baba': {'H':'FF38506A','F':'FFE5B987','O':'FF08275A','B':'FF115E9E','C':'FF2AD1C9','W':'FFFFFFFF','G':'FFFFD266'},
    'ma': {'H':'FF482E6E','F':'FFF0AF8F','O':'FF08275A','B':'FF8259BD','C':'FFFF8DBB','W':'FFFFFFFF','G':'FFFFD266'},
    'chotu': {'H':'FF243868','F':'FFFFC89D','O':'FF08275A','B':'FF00A9D3','C':'FFFFD266','W':'FFFFFFFF','G':'FFFFE38A'},
}

# 12 x 14 authored pixel grids. One cell becomes an editable Rive rectangle.
SPRITES = {
 'vijay': [
  '............','..OOOOOOOO..','.OHHHHHHHHO.','OHHHHHHHHHHO','OHHFFFFFFHHO','OFFDFFFDFFFO','OFFFFFFFFFFO','OFFFOOOOFFFO','.OOFFFFFFOO.','..OOCBBBO...','.OBBWWWBBBO.','.OBBWGWBBBO.','..OBBBBBBO..','..OOO..OOO..'],
 'milan': [
  '............','..OOOOOOOO..','.OHHHHHHHHO.','OHHHHHHHHHHO','OHCFFFFFFCHO','OFFDFFFDFFFO','OCFFFFFFFFCO','OFFFOOOOFFFO','.OOFFFFFFOO.','..OOBWBBO...','.OBBCGBBBO..','.OBBCGBBBO..','..OBBBBBBO..','..OOO..OOO..'],
 'riya': [
  '............','..OOOOOOOO..','.OHHHHHHHHO.','OHHHHHHHHHHO','OHFFFFFFFHHO','OHFDFFFDFFHO','OHFFFFFFFHHO','OHFFOOOFFHHO','.OOFFFFFFOO.','..OOCBBBO...','.OCBBBBBCBO.','.OCBBBOOOBO.','..OBBBOCCO..','..OOO..OOO..'],
 'tara': [
  '............','..OOOOOOOO..','.OHHHHHHHHO.','OHHHHHHHHHHO','OHFFFFFFFHHO','OFFDFFFDFFFO','OFFFFFFFFFO.','OFFFDOODFFO.','OOFFFFFFOO..','..OOBBBBO...','.OBCBBBB CBO.'.replace(' ',''),'.OBBBBBBBBO.','..OBCBBCBO..','..OOO..OOO..'],
 'milo': [
  '............','..OOOOOOOO..','.OHHHHHHHHO.','OHHHHHHHHHHO','OHHFFFFFFHHO','OFFDFFFDFFFO','OFFFFFFFFFFO','OFFFOOOOFFFO','.OOFFFFFFOO.','..OOBWBBO...','.OBBWGBBBO..','.OBBWGBBBO..','..OBBBBBBO..','..OOO..OOO..'],
 'baba': [
  '............','..OOOOOOOO..','.OHHHHHHHHO.','OHHHHHHHHHHO','OHFFFFFFFHHO','OFFDFFFDFFFO','OFFFFFFFFFFO','OFFFOOOOFFFO','.OOFFFFFFOO.','..OOBBBBO...','.OBCBBBB CBO.'.replace(' ',''),'.OBBBBBBBBO.','..OBCBBCBO..','..OOO..OOO..'],
 'ma': [
  '............','..OOOOOOOO..','.OHHHHHHHHO.','OHHHHHHHHHHO','OHFFFFFFFHHO','OFFDFFFDFFFO','OFFFFFFFFFFO','OFFFOOOOFFFO','.OOFFFFFFOO.','..OOBBBBO...','.OBCBBBB CBO.'.replace(' ',''),'.OBCBBBB CBO.'.replace(' ',''),'..OBCBBCBO..','..OOO..OOO..'],
 'chotu': [
  '............','...OOOOOO...','..OHHHHHHO..','.OHHHHHHHHO.','.OHFFFFFHO..','.OFFDFFDFFO.','.OFFFFFFFO..','.OFFOOOFFO..','..OFFFFFO...','..OOBBBO....','.OBCBBCBO...','.OBBBBBBO...','..OBBBBO....','..OO..OO....'],
}

def project(name):
    palette = {**PALETTES[name], 'D':'FF08275A'}
    lines = SPRITES[name]
    assert len(lines) == 14 and all(len(row) == 12 for row in lines), (name, [len(row) for row in lines])
    shapes = []
    ident = 20
    for row, line in enumerate(lines):
        for col, color in enumerate(line):
            if color == '.': continue
            ident += 1
            shapes.append(f'''<Shape x="{col*8+14}" y="{row*8+4}" name="pixel-{row}-{col}" id="0:{ident}">
              <Rectangle width="8" height="8" name="Path"/>
              <Fill name="Fill"><SolidColor colorValue="{palette[color]}" name="Color"/></Fill>
            </Shape>''')
    # A gold marker has a looping Rive timeline, while web CSS adds a gentle body bob.
    shapes.insert(0, '''<Shape x="102" y="18" name="status-star" id="0:14">
       <Rectangle originX="0.5" originY="0.5" width="8" height="8" name="Path"/>
       <Fill name="Fill"><SolidColor colorValue="FFFFD266" name="Color"/></Fill>
    </Shape>''')
    rml = f'''<Rive version="1" kind="fragment"><Artboard defaultStateMachineId="0:7" width="124" height="124" name="{name}" id="0:2">
      {''.join(shapes)}
      <StateMachine name="Idle" id="0:7"><StateMachineLayer name="Loop" id="0:8"><AnyState x="200" y="-120"/><ExitState x="400" y="-120"/><EntryState><StateTransition stateToId="0:12"/></EntryState><AnimationState x="200" animationId="0:6" id="0:12"/></StateMachineLayer></StateMachine>
      <LinearAnimation loopValue="1" duration="90" name="Sparkle" id="0:6"><KeyedObject objectId="0:14"><KeyedProperty propertyKey="15"><KeyFrameDouble value="0" interpolationType="1"/><KeyFrameDouble value="6.2831855" interpolationType="1" frame="90"/></KeyedProperty></KeyedObject></LinearAnimation>
      </Artboard></Rive>'''
    target = PROJECTS / name
    target.mkdir(parents=True, exist_ok=True)
    (target / 'rive.yaml').write_text(f'name: {name}\nlogs:\n  file: build/rive.log\n  problems: build/problems.log\n', encoding='utf-8')
    (target / 'scene.rml').write_text(rml, encoding='utf-8')
    svg_shapes=[]
    for row,line in enumerate(lines):
        for col,color in enumerate(line):
            if color!='.': svg_shapes.append(f'<rect x="{col*8+10}" y="{row*8}" width="8" height="8" fill="#{palette[color][2:]}"/>')
    PUBLIC.mkdir(parents=True, exist_ok=True)
    (PUBLIC / (name+'.svg')).write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 124 124" shape-rendering="crispEdges">'+''.join(svg_shapes)+'</svg>', encoding='utf-8')
    subprocess.run([str(RIVE), str(target), '--verify'], check=True)
    subprocess.run([str(RIVE), str(target), '--once'], check=True)
    import shutil
    PUBLIC.mkdir(parents=True, exist_ok=True)
    shutil.copy2(target / 'build' / (name + '.riv'), PUBLIC / (name + '.riv'))
    PUBLIC.mkdir(parents=True, exist_ok=True)
    subprocess.run(['node', str(ROOT / 'scripts' / 'render-crew.mjs'), name], check=True)

for member in SPRITES:
    project(member)
