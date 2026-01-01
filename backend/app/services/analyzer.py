from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
import numpy as np
from io import BytesIO
from colorthief import ColorThief
import colorsys


class ImageAnalyzer:
    # Common EXIF tag IDs
    EXIF_FOCAL_LENGTH = 37386
    EXIF_FOCAL_LENGTH_35MM = 41989
    EXIF_FNUMBER = 33437
    EXIF_ISO = 34855
    EXIF_EXPOSURE_TIME = 33434
    EXIF_MAKE = 271
    EXIF_MODEL = 272
    EXIF_LENS_MODEL = 42036

    def _extract_exif(self, image: Image.Image) -> dict:
        """Extract EXIF metadata from image."""
        exif_data = {}
        try:
            exif = image._getexif()
            if exif:
                for tag_id, value in exif.items():
                    tag = TAGS.get(tag_id, tag_id)
                    exif_data[tag] = value
                    exif_data[tag_id] = value  # Also store by ID for reliable lookup
        except (AttributeError, KeyError, TypeError):
            pass
        return exif_data

    def _format_exposure_time(self, exposure) -> str:
        """Format exposure time as a fraction."""
        if exposure is None:
            return None
        try:
            # Handle IFDRational or tuple
            if hasattr(exposure, 'numerator'):
                num, den = exposure.numerator, exposure.denominator
            elif isinstance(exposure, tuple):
                num, den = exposure
            else:
                val = float(exposure)
                if val >= 1:
                    return f"{val:.1f}s"
                return f"1/{int(1/val)}s"

            if num == 0:
                return None
            if den == 1:
                return f"{num}s"
            # Simplify fraction
            if num == 1:
                return f"1/{den}s"
            return f"{num}/{den}s"
        except (TypeError, ValueError, ZeroDivisionError):
            return None
    def analyze(self, image_bytes: BytesIO) -> dict:
        image = Image.open(image_bytes)
        image_bytes.seek(0)

        camera_analysis = self._analyze_camera(image)
        lighting_analysis = self._analyze_lighting(image)
        color_analysis = self._analyze_color(image_bytes, image)

        summary = self._generate_summary(camera_analysis, lighting_analysis, color_analysis)

        return {
            "camera": camera_analysis,
            "lighting": lighting_analysis,
            "color": color_analysis,
            "summary": summary,
            "recreationGuide": self._generate_recreation_guide(
                camera_analysis, lighting_analysis, color_analysis
            ),
        }

    def _analyze_camera(self, image: Image.Image) -> dict:
        width, height = image.size
        aspect_ratio = width / height

        # First, try to extract EXIF data
        exif = self._extract_exif(image)
        has_exif = len(exif) > 0

        img_array = np.array(image.convert("L"))

        # Focal Length - prefer EXIF
        focal_exif = exif.get(self.EXIF_FOCAL_LENGTH) or exif.get('FocalLength')
        focal_35mm = exif.get(self.EXIF_FOCAL_LENGTH_35MM) or exif.get('FocalLengthIn35mmFilm')

        if focal_exif:
            try:
                focal_val = float(focal_exif)
                if focal_35mm:
                    focal_estimate = f"{focal_val:.0f}mm ({float(focal_35mm):.0f}mm equiv)"
                else:
                    focal_estimate = f"{focal_val:.0f}mm"
                # Determine sensor hint based on focal length
                if focal_val < 24:
                    sensor_hint = "Ultra-wide angle lens"
                elif focal_val < 35:
                    sensor_hint = "Wide angle lens"
                elif focal_val < 50:
                    sensor_hint = "Wide-normal lens"
                elif focal_val < 85:
                    sensor_hint = "Standard lens"
                elif focal_val < 135:
                    sensor_hint = "Portrait/Short telephoto"
                else:
                    sensor_hint = "Telephoto lens"
            except (TypeError, ValueError):
                focal_estimate, sensor_hint = self._estimate_focal_length(img_array, width, height)
        else:
            focal_estimate, sensor_hint = self._estimate_focal_length(img_array, width, height)

        # Aperture - prefer EXIF
        fnumber = exif.get(self.EXIF_FNUMBER) or exif.get('FNumber')
        if fnumber:
            try:
                f_val = float(fnumber)
                aperture = f"f/{f_val:.1f}"
                if f_val <= 2.0:
                    dof = "Shallow"
                elif f_val <= 5.6:
                    dof = "Medium"
                else:
                    dof = "Deep"
            except (TypeError, ValueError):
                aperture, dof = self._estimate_aperture(img_array)
        else:
            aperture, dof = self._estimate_aperture(img_array)

        # ISO - prefer EXIF
        iso_exif = exif.get(self.EXIF_ISO) or exif.get('ISOSpeedRatings')
        if iso_exif:
            try:
                # ISO can be a single value or a tuple
                if isinstance(iso_exif, (list, tuple)):
                    iso_val = int(iso_exif[0])
                else:
                    iso_val = int(iso_exif)
                iso = f"ISO {iso_val}"
            except (TypeError, ValueError, IndexError):
                iso = self._estimate_iso(img_array)
        else:
            iso = self._estimate_iso(img_array)

        # Shutter Speed - prefer EXIF
        exposure = exif.get(self.EXIF_EXPOSURE_TIME) or exif.get('ExposureTime')
        shutter = self._format_exposure_time(exposure)
        if not shutter:
            shutter = self._estimate_shutter(img_array)

        # Camera/Lens info
        camera_make = exif.get(self.EXIF_MAKE) or exif.get('Make', '')
        camera_model = exif.get(self.EXIF_MODEL) or exif.get('Model', '')
        lens_model = exif.get(self.EXIF_LENS_MODEL) or exif.get('LensModel', '')

        camera_info = None
        if camera_make or camera_model:
            camera_info = f"{camera_make} {camera_model}".strip()

        result = {
            "focalLength": focal_estimate,
            "aperture": aperture,
            "depthOfField": dof,
            "iso": iso,
            "shutterSpeed": shutter,
            "sensorSize": sensor_hint,
            "aspectRatio": f"{width}:{height}",
            "hasExif": has_exif,
        }

        if camera_info:
            result["camera"] = camera_info
        if lens_model:
            result["lens"] = str(lens_model)

        return result

    def _estimate_aperture(self, img_array: np.ndarray) -> tuple:
        """Estimate aperture from edge variance when EXIF not available."""
        edges = np.abs(np.diff(img_array.astype(float), axis=0))
        edge_variance = np.var(edges)

        if edge_variance > 2000:
            return "f/5.6 - f/8 (estimated)", "Deep"
        elif edge_variance > 1000:
            return "f/2.8 - f/4 (estimated)", "Medium"
        else:
            return "f/1.4 - f/2.0 (estimated)", "Shallow"

    def _estimate_iso(self, img_array: np.ndarray) -> str:
        """Estimate ISO from brightness when EXIF not available."""
        brightness = np.mean(img_array)
        if brightness > 150:
            return "Low ISO (estimated)"
        elif brightness > 80:
            return "Medium ISO (estimated)"
        else:
            return "High ISO (estimated)"

    def _estimate_shutter(self, img_array: np.ndarray) -> str:
        """Estimate shutter speed from motion blur when EXIF not available."""
        motion_blur = self._detect_motion_blur(img_array)
        if motion_blur > 0.7:
            return "Slow shutter (estimated)"
        elif motion_blur > 0.4:
            return "~1/60s - 1/125s (estimated)"
        else:
            return "Fast shutter (estimated)"

    def _detect_motion_blur(self, gray_image: np.ndarray) -> float:
        laplacian = np.abs(
            gray_image[:-2, 1:-1].astype(float)
            + gray_image[2:, 1:-1].astype(float)
            + gray_image[1:-1, :-2].astype(float)
            + gray_image[1:-1, 2:].astype(float)
            - 4 * gray_image[1:-1, 1:-1].astype(float)
        )
        sharpness = np.var(laplacian)
        blur_score = 1.0 - min(sharpness / 500, 1.0)
        return blur_score

    def _estimate_focal_length(self, gray_image: np.ndarray, width: int, height: int) -> tuple:
        """
        Estimate focal length based on perspective distortion analysis.
        Wide angle lenses show more edge distortion and perspective exaggeration.
        """
        h, w = gray_image.shape

        # 1. Analyze edge vs center sharpness (wide angles have softer corners)
        center_region = gray_image[h//3:2*h//3, w//3:2*w//3]
        corner_tl = gray_image[:h//4, :w//4]
        corner_tr = gray_image[:h//4, 3*w//4:]
        corner_bl = gray_image[3*h//4:, :w//4]
        corner_br = gray_image[3*h//4:, 3*w//4:]

        def get_sharpness(region):
            if region.size < 100:
                return 0
            gx = np.diff(region.astype(float), axis=1)
            gy = np.diff(region.astype(float), axis=0)
            return float(np.mean(np.abs(gx)) + np.mean(np.abs(gy)))

        center_sharp = get_sharpness(center_region)
        corner_sharp = np.mean([
            get_sharpness(corner_tl),
            get_sharpness(corner_tr),
            get_sharpness(corner_bl),
            get_sharpness(corner_br)
        ])

        # Edge falloff ratio - wide angles have more falloff
        if center_sharp > 0:
            edge_falloff = corner_sharp / center_sharp
        else:
            edge_falloff = 1.0

        # 2. Analyze gradient direction variance (wide angles have more radial distortion)
        gx = np.diff(gray_image.astype(float), axis=1)
        gy = np.diff(gray_image.astype(float), axis=0)

        # Sample points from edges
        edge_gradient_variance = 0
        samples = []
        for i in range(0, h, h//10):
            for j in range(0, min(w-1, gx.shape[1]), w//10):
                if i < gy.shape[0] and j < gx.shape[1]:
                    samples.append(np.sqrt(gx[i,j]**2 + gy[min(i,gy.shape[0]-1),j]**2))

        if samples:
            edge_gradient_variance = float(np.var(samples))

        # 3. Analyze brightness falloff from center to edges (vignetting, more on wide angles)
        center_brightness = float(np.mean(center_region))
        corner_brightness = float(np.mean([
            np.mean(corner_tl), np.mean(corner_tr),
            np.mean(corner_bl), np.mean(corner_br)
        ]))

        if center_brightness > 0:
            vignette_ratio = corner_brightness / center_brightness
        else:
            vignette_ratio = 1.0

        # 4. Calculate focal length score
        # Lower edge_falloff = more corner softness = wider lens
        # Lower vignette_ratio = more vignetting = wider lens
        # Higher edge_gradient_variance = more distortion = wider lens

        wide_score = 0

        # Edge sharpness falloff (wide lenses have softer corners)
        # This is the most reliable indicator
        if edge_falloff < 0.6:
            wide_score += 5
        elif edge_falloff < 0.7:
            wide_score += 4
        elif edge_falloff < 0.8:
            wide_score += 3
        elif edge_falloff < 0.9:
            wide_score += 2
        elif edge_falloff < 1.0:
            wide_score += 1

        # Vignetting (wide lenses have more vignetting)
        # Note: image content can affect this, so weight it less
        if vignette_ratio < 0.7:
            wide_score += 2
        elif vignette_ratio < 0.85:
            wide_score += 1

        # Gradient variance (perspective distortion)
        if edge_gradient_variance > 800:
            wide_score += 2
        elif edge_gradient_variance > 300:
            wide_score += 1

        # Map score to focal length estimate
        if wide_score >= 6:
            focal_estimate = "~14-24mm (ultra-wide)"
            sensor_hint = "Ultra-wide angle lens"
        elif wide_score >= 4:
            focal_estimate = "~24-35mm (wide)"
            sensor_hint = "Wide angle lens"
        elif wide_score >= 3:
            focal_estimate = "~35mm"
            sensor_hint = "Wide-normal lens"
        elif wide_score >= 2:
            focal_estimate = "~50mm"
            sensor_hint = "Standard lens"
        elif wide_score >= 1:
            focal_estimate = "~50-85mm"
            sensor_hint = "Standard to short tele"
        else:
            focal_estimate = "~85mm+"
            sensor_hint = "Portrait/Telephoto lens"

        return focal_estimate, sensor_hint

    def _analyze_lighting(self, image: Image.Image) -> dict:
        img_array = np.array(image.convert("L"))
        h, w = img_array.shape

        left_half = img_array[:, : w // 2]
        right_half = img_array[:, w // 2 :]
        left_brightness = np.mean(left_half)
        right_brightness = np.mean(right_half)

        if right_brightness > left_brightness * 1.1:
            key_side = "right"
            key_angle = "45°"
        elif left_brightness > right_brightness * 1.1:
            key_side = "left"
            key_angle = "45°"
        else:
            key_side = "frontal"
            key_angle = "0° (frontal)"

        top_half = img_array[: h // 2, :]
        bottom_half = img_array[h // 2 :, :]
        top_brightness = np.mean(top_half)
        bottom_brightness = np.mean(bottom_half)

        if top_brightness > bottom_brightness * 1.2:
            vertical_angle = "30° up"
        elif bottom_brightness > top_brightness * 1.1:
            vertical_angle = "below eye level"
        else:
            vertical_angle = "eye level"

        contrast = np.std(img_array)
        if contrast > 70:
            quality = "Hard"
            ratio = "4:1 or higher"
        elif contrast > 45:
            quality = "Medium"
            ratio = "3:1"
        else:
            quality = "Soft"
            ratio = "2:1"

        bright_threshold = np.percentile(img_array, 95)
        bright_regions = img_array > bright_threshold
        num_bright_clusters = self._count_clusters(bright_regions)
        sources = str(min(max(num_bright_clusters, 1), 4))

        pattern = self._detect_lighting_pattern(img_array)

        rgb_array = np.array(image.convert("RGB"))
        avg_r = np.mean(rgb_array[:, :, 0])
        avg_b = np.mean(rgb_array[:, :, 2])

        if avg_r > avg_b * 1.15:
            temperature = "Warm (3200K - 4500K)"
        elif avg_b > avg_r * 1.1:
            temperature = "Cool (5600K - 7000K)"
        else:
            temperature = "Neutral (5000K - 5600K)"

        return {
            "keyLightAngle": key_angle,
            "keyLightSide": key_side,
            "verticalAngle": vertical_angle,
            "quality": quality,
            "ratio": ratio,
            "sources": sources,
            "pattern": pattern,
            "temperature": temperature,
            "fillLight": bool(contrast < 60),
            "backLight": bool(top_brightness > np.mean(img_array) * 1.1),
        }

    def _count_clusters(self, binary_image: np.ndarray) -> int:
        """Simple cluster counting without scipy dependency."""
        bright_pixels = np.sum(binary_image)
        total_pixels = binary_image.size
        bright_ratio = bright_pixels / total_pixels

        if bright_ratio > 0.15:
            return 3
        elif bright_ratio > 0.08:
            return 2
        else:
            return 1

    def _detect_lighting_pattern(self, gray_image: np.ndarray) -> str:
        h, w = gray_image.shape
        center_region = gray_image[h // 3 : 2 * h // 3, w // 3 : 2 * w // 3]
        left_region = gray_image[h // 3 : 2 * h // 3, : w // 3]
        right_region = gray_image[h // 3 : 2 * h // 3, 2 * w // 3 :]

        center_mean = np.mean(center_region)
        left_mean = np.mean(left_region)
        right_mean = np.mean(right_region)

        diff = abs(left_mean - right_mean)

        if diff > 40:
            return "Split"
        elif diff > 20:
            return "Rembrandt"
        elif center_mean > (left_mean + right_mean) / 2 * 1.1:
            return "Butterfly"
        else:
            return "Loop"

    def _analyze_color(self, image_bytes: BytesIO, image: Image.Image) -> dict:
        try:
            color_thief = ColorThief(image_bytes)
            palette = color_thief.get_palette(color_count=6, quality=1)
            palette_hex = ["#" + "".join(f"{c:02x}" for c in color) for color in palette]
        except Exception:
            palette_hex = ["#1a2634", "#3d4f5f", "#d4a574", "#f5e6d3", "#8b5a2b"]

        rgb_array = np.array(image.convert("RGB"))
        avg_color = np.mean(rgb_array, axis=(0, 1))

        r, g, b = avg_color / 255.0
        h, l, s = colorsys.rgb_to_hls(r, g, b)

        if h < 0.1 or h > 0.9:
            temp = "Warm (orange/red tones)"
        elif 0.1 <= h < 0.2:
            temp = "Warm (yellow tones)"
        elif 0.5 <= h < 0.7:
            temp = "Cool (blue/teal tones)"
        else:
            temp = "Neutral"

        shadows = rgb_array[rgb_array.mean(axis=2) < 85]
        highlights = rgb_array[rgb_array.mean(axis=2) > 170]

        if len(shadows) > 0:
            shadow_avg = np.mean(shadows, axis=0)
            if shadow_avg[2] > shadow_avg[0]:
                shadow_tint = "Teal/Blue tint"
            elif shadow_avg[0] > shadow_avg[2]:
                shadow_tint = "Warm/Brown tint"
            else:
                shadow_tint = "Neutral"
        else:
            shadow_tint = "Neutral"

        if len(highlights) > 0:
            highlight_avg = np.mean(highlights, axis=0)
            if highlight_avg[0] > highlight_avg[2]:
                highlight_tint = "Warm highlights"
            elif highlight_avg[2] > highlight_avg[0]:
                highlight_tint = "Cool highlights"
            else:
                highlight_tint = "Neutral"
        else:
            highlight_tint = "Neutral"

        gray = np.array(image.convert("L"))
        contrast = np.std(gray)
        if contrast > 65:
            contrast_level = "High"
        elif contrast > 40:
            contrast_level = "Medium"
        else:
            contrast_level = "Low"

        if s > 0.5:
            saturation = "Saturated"
        elif s > 0.25:
            saturation = "Normal"
        else:
            saturation = "Desaturated"

        # Analyze tone curve from image histogram
        tone_curve = self._analyze_tone_curve(gray)

        return {
            "palette": palette_hex,
            "temperature": temp,
            "contrast": contrast_level,
            "saturation": saturation,
            "shadows": f"Lifted, {shadow_tint}",
            "highlights": highlight_tint,
            "toneCurve": tone_curve,
        }

    def _analyze_tone_curve(self, gray: np.ndarray) -> list:
        """
        Analyze the image's tonal distribution and return control points for a tone curve.
        Returns a list of [x, y] points where x is input (0-100) and y is output (0-100).
        """
        # Compute histogram
        hist, _ = np.histogram(gray.flatten(), bins=256, range=(0, 256))

        # Compute cumulative distribution function (CDF)
        cdf = hist.cumsum()
        cdf_normalized = cdf / cdf[-1]  # Normalize to 0-1

        # Sample the CDF at key points to create curve control points
        # We sample at shadows, quarter-tones, midtones, three-quarter-tones, highlights
        sample_points = [0, 32, 64, 96, 128, 160, 192, 224, 255]
        curve_points = []

        for input_val in sample_points:
            # The CDF tells us what percentage of pixels are at or below this value
            # We use this to derive the "output" value for the curve
            output_val = cdf_normalized[input_val] * 100
            input_normalized = (input_val / 255) * 100
            curve_points.append([round(input_normalized, 1), round(output_val, 1)])

        # Analyze characteristics for additional curve shaping
        # Check if shadows are lifted (black point is raised)
        black_point = np.percentile(gray, 2)
        white_point = np.percentile(gray, 98)

        # Adjust curve based on actual tonal range
        if black_point > 20:  # Lifted shadows
            # Raise the shadow portion of the curve
            for i, pt in enumerate(curve_points):
                if pt[0] < 25:
                    lift_amount = (black_point / 255) * 100 * 0.5
                    curve_points[i][1] = min(100, pt[1] + lift_amount * (1 - pt[0]/25))

        if white_point < 235:  # Crushed highlights
            # Lower the highlight portion
            for i, pt in enumerate(curve_points):
                if pt[0] > 75:
                    crush_amount = ((255 - white_point) / 255) * 100 * 0.5
                    curve_points[i][1] = max(0, pt[1] - crush_amount * ((pt[0] - 75) / 25))

        # Ensure curve is valid (monotonically increasing, within bounds)
        for i, pt in enumerate(curve_points):
            curve_points[i][1] = max(0, min(100, pt[1]))

        # Convert to list of floats for JSON serialization
        return [[float(p[0]), float(p[1])] for p in curve_points]

    def _generate_summary(self, camera: dict, lighting: dict, color: dict) -> str:
        return (
            f"This appears to be a {camera['depthOfField'].lower()} depth of field shot, "
            f"likely captured with a {camera['focalLength']} lens at {camera['aperture']}. "
            f"The lighting is {lighting['quality'].lower()} with the key light positioned at "
            f"{lighting['keyLightAngle']} from camera {lighting['keyLightSide']}. "
            f"The color grade features {color['temperature'].lower()} tones with {color['contrast'].lower()} contrast."
        )

    def _generate_recreation_guide(
        self, camera: dict, lighting: dict, color: dict
    ) -> list:
        return [
            f"Use a {camera['focalLength']} lens at {camera['aperture']} for similar depth of field",
            f"Position your key light at {lighting['keyLightAngle']} from camera {lighting['keyLightSide']}, {lighting['verticalAngle']}",
            f"Use a {lighting['quality'].lower()} light source (softbox for soft, bare bulb for hard)",
            f"Aim for a {lighting['ratio']} lighting ratio between key and fill",
            f"In post, apply a {color['temperature'].lower()} grade with {color['contrast'].lower()} contrast",
            f"Push shadows toward {color['shadows'].split(', ')[-1].lower()} for the cinematic look",
        ]
