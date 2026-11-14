# NASA sources

| Source | Intended use |
| --- | --- |
| [NASA CCMC DONKI](https://ccmc.gsfc.nasa.gov/tools/DONKI/) · [Archived SEP record](https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/SEP/30717/1) | Trigger the shelter decision using an archived solar energetic particle event. The [local snapshot](../src/data/nasa/donki-sep-2024-05-11.json) records the activity ID, observation time, and observing instrument. |
| [NASA SVS lunar south pole illumination](https://svs.gsfc.nasa.gov/4930/) | Derive each turn's sunlight or shadow from a fixed point in the selected frame sequence. |
| [NASA ECLSS](https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/) | Explain how life support maintains air and water for the crew. |
| [NASA Veggie](https://science.nasa.gov/biological-physical/focus-areas/plant-biology/hardware/) | Explain why the greenhouse needs water and powered lights. |
| [NASA Artemis I radiation research](https://www.nasa.gov/general/artemis-i-space-radiation-research-to-help-moon-mars-explorers/) | Explain why the crew shelters during a solar particle event. |

## First mission data

`src/data/lunar-south-pole.json` uses the 2024 sequence from NASA SVS 4930. NASA describes the visualization as covering the area within 2 degrees of the South Pole and rendering it at two-hour intervals. The mission samples one fixed point in the rendered 1920×1080 frames at pixel `(976, 524)`. A pixel value of at least 50 on the rendered grayscale is classified as sunlight; lower values are classified as shadow. This pixel threshold is a game input rule, not a NASA-provided illumination classification or a surveyed surface coordinate.

| Shift | UTC timestamp | NASA frame | Illumination | Event |
| --- | --- | ---: | --- | --- |
| 1 | 2024-05-11 00:00 | 1573 | Sunlight | |
| 2 | 2024-05-11 02:00 | 1574 | Sunlight | |
| 3 | 2024-05-11 04:00 | 1575 | Sunlight | SEP observed at 04:07 UTC |
| 4 | 2024-05-11 06:00 | 1576 | Shadow | |
| 5 | 2024-05-11 08:00 | 1577 | Shadow | |
| 6 | 2024-05-11 10:00 | 1578 | Shadow | |

The frame URLs are stored on each turn. NASA SVS credits are recorded in the scenario as NASA's Scientific Visualization Studio, Ernie Wright, and Noah Petro (NASA/GSFC). The DONKI event reference is the archived local activity ID `2024-05-11T04:07:00-SEP-001`; the scenario loader checks that the event reference resolves.

The mission is marked `draft`. Solar output 8, life-support cost 4, and greenhouse cost 3 are the first-episode values from the approved plan. Battery capacity and charge, food use, crop growth and yield, radiation effect, and crew thresholds are provisional game values stored in the scenario for route testing; they need designer approval before release. These are not NASA measurements. DONKI records the particle event at STEREO A, and lunar surface dose would require a separate model.

[NASA OSDR RadLab](https://visualization.osdr.nasa.gov/radlab/gui/data-api/) can support a future lesson on measured radiation exposure aboard the ISS, with the measurement site and units shown. [NASA Mars Trek](https://trek.nasa.gov/mars/) is a candidate data source for a separate Mars mission.
