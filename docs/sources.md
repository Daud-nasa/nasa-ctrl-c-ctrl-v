# NASA sources

| Source | Intended use |
| --- | --- |
| [NASA CCMC DONKI](https://ccmc.gsfc.nasa.gov/tools/DONKI/) · [Archived SEP record](https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/SEP/30717/1) | Trigger the shelter decision using an archived solar energetic particle event. The [local snapshot](../src/data/nasa/donki-sep-2024-05-11.json) records the activity ID, observation time, and observing instrument. |
| [NASA SVS lunar south pole illumination](https://svs.gsfc.nasa.gov/4930/) | Derive each turn's sunlight or shadow from a fixed point in the selected frame sequence. |
| [NASA ECLSS](https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/) | Explain how life support maintains air and water for the crew. |
| [NASA Veggie](https://science.nasa.gov/biological-physical/focus-areas/plant-biology/hardware/) | Explain why the greenhouse needs water and powered lights. |
| [NASA Artemis I radiation research](https://www.nasa.gov/general/artemis-i-space-radiation-research-to-help-moon-mars-explorers/) | Explain why the crew shelters during a solar particle event. |

When adding the mission data, record the visualization year, frame numbers or timestamps, location within each frame, and NASA credits. The frame sequence drives the sunlight or shadow input. Power costs, battery capacity, crop growth, radiation scores, shelter effectiveness, and placement of the historical event in the mission are game design assumptions. DONKI records the particle event at STEREO A. Lunar surface dose would require a separate model.

[NASA OSDR RadLab](https://visualization.osdr.nasa.gov/radlab/gui/data-api/) can support a future lesson on measured radiation exposure aboard the ISS, with the measurement site and units shown. [NASA Mars Trek](https://trek.nasa.gov/mars/) is a candidate data source for a separate Mars mission.
