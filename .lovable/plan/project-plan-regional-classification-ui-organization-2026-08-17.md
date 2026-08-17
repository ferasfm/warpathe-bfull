# Project Plan - Regional Classification & UI Organization

The goal is to organize Al-Huda fuel stations into three main geographic regions: **Central (الوسط)**, **North (الشمال)**, and **South (الجنوب)**. This will improve navigation for customers and management for admins.

## Proposed Strategy

### 1. Database Update
- Add a `region` column to the `public.stations` table.
- Categorize current stations:
  - **North**: Nablus, Salfit.
  - **Central**: Ramallah, Al-Masyoun, Al-Bireh, Beit Ur al-Tahta, Jericho.
  - **South**: Bethlehem.
  - *(Note: We will add Hebron, Jenin, etc., as we expand).*

### 2. Customer Hub (Home Page) UI
- Add a "Region Selector" (Tabs or Filter buttons) at the top of the station list.
- **North (الشمال)** | **Central (الوسط)** | **South (الجنوب)** | **All (الكل)**.
- Group the station cards visually under region headings if "All" is selected.

### 3. Admin Dashboard UI
- Add a region filter to the Admin Overview to see fuel status by geographic area.
- Add a "Region" field when adding or editing a station.

### 4. Technical Detail
- Update `stations` table RLS and types.
- Update `NewsTicker` to show regional summaries (e.g., "Fuel is available in most Central region stations").

## Confirmation
I understand that you want to divide the stations into **Central**, **North**, and **South** regions. Before I execute the database changes and UI updates, does this plan match your vision?
