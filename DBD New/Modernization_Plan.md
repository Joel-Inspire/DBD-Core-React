# DemandBridge Modernization Project Plan

## 1. Project Overview

**Goal**: To upgrade the legacy DemandBridge application (written in ProvideX Business Basic with a flat-file database) into a modern, cloud-hosted web application. The new application will retain full existing features and functionality while incorporating API capabilities, scalability, a MACH (Microservices, API-first, Cloud-native, Headless) architecture, and hosting on Microsoft Azure.

**New Code Repository**: `C:\Users\JoelMassicotte\Documents\GitHub\DBD-Core-React\DBD New\`

## 2. Project Phases

### Phase 1: Legacy Application Assessment (Current Phase)

**Objective**: To gain a comprehensive understanding of the existing DemandBridge application's features, architecture, business logic, and data structures.

**Activities**:
1.  **Initial Codebase Exploration (Completed)**:
    *   Listed contents of the root application directory.
    *   Identified key files like `DB Distributor Schema 20221215.txt`.
    *   Mapped top-level source code directories (`src/tf2g`, `src/tf2p`, `src/tf2w`, `src/tf2y`, `src/tf2z`).
2.  **Database Schema Analysis (Completed)**:
    *   Reviewed `DB Distributor Schema 20221215.txt` to understand table structures, columns, data types, offsets, lengths, and key relationships.
    *   Identified modular prefixes (AP, AR, GL, IC, OE, PO) indicating application modules.
3.  **Core Transactional File Schema Reconstruction (New Finding)**:
    *   The `DB Distributor Schema 20221215.txt` file, while useful for some areas, does not appear to contain clear definitions for critical transactional files such as `FS1` (Sales Order Header), `FS2` (Sales Order Detail), and `IC0` (Item Master), despite extensive searches.
    *   Further investigation into system utilities like `ZZFLES.pxprg` and `ZZWIOL.pxprg` reveals that the ProvideX system likely uses embedded or linked data dictionaries for these files, which are accessed programmatically (e.g., via `DICTIONARY READ`). The text schema export seems incomplete in this regard.
    *   Therefore, the detailed schemas for these core files will need to be meticulously reconstructed by analyzing the ProvideX program code that defines and interacts with them (e.g., modules `FM2` for Sales Orders, `IC` for Inventory, and related data handling programs). This reconstructed schema will be essential for the new database design and data migration efforts.
4.  **Source Code Structure Mapping (Completed)**:
    *   Analyzed file types (`.pxprg` for programs, `.pxkey` for potential key/form/data files).
    *   Correlated directory structures (e.g., `APG`, `ARG`) with application modules.
    *   Identified patterns like report programs (`R*.pxprg`) and utility programs (`Y*.pxprg`, `ZZ*.pxprg`).
5.  **Detailed Module & Feature Analysis (Ongoing)**:
    *   Select critical modules for in-depth review (e.g., Order Entry, Inventory Control, Accounts Receivable/Customer Management, Purchase Orders, General Ledger).
    *   Examine sample `.pxprg` files from these modules to understand:
        *   Core functionality and business logic.
        *   Data file interactions and data flow.
        *   User interface elements and interactions.
        *   Calls to shared utilities or libraries.
6.  **Investigate `.pxkey` File Roles**:
    *   Determine the exact nature of `.pxkey` files (data, screen definitions, key indexes, compiled resources) by observing their usage in `.pxprg` files and potentially leveraging existing conversion utilities.
7.  **Identify Shared Components & Utilities**:
    *   Analyze common routines (e.g., `ZZWLKU`), utility directories (`UT*`, `ZZ*`), and report structures.
8.  **Document Findings**: Consolidate understanding of features, workflows, and critical business rules.

### Deduced Schema: FS2 - Sales Order Detail (from FM2ODB.pxprg)

Based on analysis of `FM2ODB.pxprg`, the following structure for `FS2` (Sales Order Detail) has been deduced. The primary record buffer `A$` is 356 bytes long, with an IOLIST mapping up to 30 numeric/special fields (A[0] to A[29]).

**Key Structure:**
- `A1$ = K9$ + A$(147,8) + A$(6,3)`
  - `K9$`: Company/Division Prefix (variable length)
  - `A$(147,8)`: Sales Order Number (CHAR, 8)
  - `A$(6,3)`: Line Number (CHAR, 3, e.g., "001" - "206")

**Notable Deduced String Fields (from `A$(start,length)`):**

- `FS2_KEY_PREFIX` (CHAR, `LEN(K9$)`): `A$(1,LEN(K9$))` - Company prefix part of the key.
- `FS2_LINE_NO` (CHAR, 3): `A$(6,3)` - Sales Order Line Number.
- `FS2_PO_LINK_TYPE_SEQ` (CHAR, 1): `A$(9,1)` - Purchase Order link type/sequence.
- `FS2_ITEM_SUFFIX_QUALIFIER` (CHAR, 4): `A$(10,4)` - Item Suffix/Qualifier.
- `FS2_USE_ORDER_CUST_FLAG` (CHAR, 1): `A$(14,1)` - (Y/N) Use order customer vs. general item details.
- `FS2_WAREHOUSE_CODE` (CHAR, 3): `A$(15,3)` - Warehouse Code.
- `FS2_ITEM_NO` (CHAR, 10): `A$(19,10)` - Item Number/Product Code.
- `FS2_TAX_PRODUCT_TYPE` (CHAR, 3): `A$(29,3)` - Tax Product Type/Code.
- `FS2_VENDOR_ITEM_SUFFIX` (CHAR, 4): `A$(90,4)` - Vendor Item Suffix.
- `FS2_VENDOR_CODE` (CHAR, 10): `A$(94,10)` - Vendor Code.
- `FS2_COSTING_UOM` (CHAR, 4): `A$(120,4)` - Unit of Measure (Costing).
- `FS2_SELLING_UOM` (CHAR, 4): `A$(124,4)` - Unit of Measure (Selling).
- `FS2_LINE_SALESPERSON_COMM_CODE` (CHAR, 5): `A$(128,5)` - Line Salesperson/Commission Code.
- `FS2_CUST_DEFAULT_FLAG` (CHAR, 1): `A$(135,1)` - From FMP customer defaults.
- `FS2_CUST_DEFAULT_SHIPTO` (CHAR, 10): `A$(137,10)` - From FMP customer defaults (ShipTo).
- `FS2_ORDER_NO` (CHAR, 8): `A$(147,8)` - Sales Order Number (key component).
- `FS2_LINE_TYPE` (CHAR, 1): `A$(155,1)` - Line Type (e.g., 'M'isc, 'S'tock, 'C'ustomer Item).
- `FS2_CUST_SPECIFIC_ITEM_CODE_OR_CUSTNO` (CHAR, 10): `A$(161,10)` - Customer Item Code or Customer # if Line Type 'C'.
- `FS2_TOPS_ITEM_FLAG` (CHAR, 1): `A$(234,1)` - Flag indicating a TOPS item (Y/N), set if `IC0.I$(118,1)` contains "USC".
- `FS2_PRICE_SOURCE_CODE` (CHAR, 3): `A$(235,3)` - Code indicating source of price (e.g., from `SP0_PRICE_TYPE$`).

**Numeric/Special Fields (`A[index]`):**

- `A[0]`: **Original Quantity or Amount** (Potentially another cost/price field or a specialized value)
- `A[2]`: **Costing UOM Factor** (Related to costing U/M)
- `A[5]`: **Selling UOM Factor** (Related to selling U/M)
- `A[11]`: **Set from FMP customer defaults** (Purpose of `A[14]` in `FS2` TBD)
- `A[12]`: **Item Weight** (From `IC0` via `FM2OB5`)

**Default Value Population (from `IC0` via `FM2OB5.pxprg` around line `5420`):**

Program `FM2OB5.pxprg` plays a critical role in defaulting values into the `FS2` sales order line (`A$`) from the `IC0` Item Master (`I$`). Key mappings include:

- **String Fields:**
  - `A$(50,40) = I$(21,40)` (e.g., Item Description)
  - `A$(29,21) = I$(61,21)` (e.g., Item Class / Extended Description)
  - `A$(120,8) = I$(116,8)` (e.g., UOM related - initial pull)
  - `A$(120,4) = I$(124,4)` (e.g., Specific UOM - potentially overrides part of above)
  - `A$(90,14)` (Vendor/Plant) is conditionally set from `I$(92,4) + I$(82,10)` (Item Master Plant + Vendor) or from `I2$` if specific supplier item lookup occurred.
- **Numeric/Mapped Fields:**
  - `A[1] = I[18]` (e.g., Cost from Item Master). For TOPS items, may be overridden by `I[17]` if `TOPS_COST` is non-zero.
  - `A[2] = I[15]` (e.g., List Price or Price UOM factor from Item Master)
  - `A[4] = I[0]` (e.g., Standard/Base Price from Item Master). This value is then adjusted by `B[9]` (Header Discount %): `A[4] = A[4] - A[4]*B[9]*.01`.
  - `A[5] = I[14]` (e.g., Cost UOM factor from Item Master)
  - `A[10]` is set from `A[14]` (Purpose of `A[14]` in `FS2` TBD).
  - `A[12] = I[19]` (e.g., Item Weight from Item Master)
  - `A[22] = A[4]` (Copies the (potentially discounted) price into another field).
  - `A[23] = B[9]` (Copies `FS1` Header Line Item Discount %).
- **Initializations:**
  - `A[0]=0`, `A[3]=0`, `A[6]=0` (Quantity/Amount fields are reset).

This defaulting logic provides a significant portion of the initial data for a sales order line item.

Further analysis or a direct data dictionary dump would be required to fully map all `A[n]` fields and their precise data types within the 356-byte record.

### Deduced Schema: IC0 - Item Master (from FM2ODB.pxprg, IC2MAA.pxprg, IC2ICE.pxprg, and IC2MAB.pxprg)

Analysis of sales order entry programs (`FM2ODB.pxprg`, `FM2OB5.pxprg`) and dedicated Item Master maintenance programs (`IC2MAA.pxprg`, `IC2ICE.pxprg`, and crucially `IC2MAB.pxprg`) provides a comprehensive view of the `IC0` (Item Master) schema.

- **Logical File Designator**: `IC0...` (opened into file slot `Z[1]` in `IC2MAA.pxprg`).
- **Record Buffer**: `A$` in maintenance programs (`I$` when read in `FM2OB5.pxprg`).
- **Structure**: `DIM A$(187+K9), A[40]` in `IC2MAA.pxprg`. This indicates a base string length of 187 bytes (assuming `K9=0` for standard items) and up to 40 mapped numeric/special fields (`A[0]` to `A[39]`).

**Key Structure (from `IC2ICE.pxprg` and `IC2MAA.pxprg`):**

- `KEY = A$(1,20)`
  - `A$(1,10)`: Customer Code (CHAR, 10) - Blank for general items.
  - `A$(11,10)`: Item Number (CHAR, 10).

**Detailed Field Definitions (Primarily from `IC2MAB.pxprg` screen handling):**

**String Fields (`A$(offset,length)` - assuming K9=0):**

- `A$(21,40)`: **Item Description** (Primary)
- `A$(61,3)`: **Product Code**
- `A$(64,8)`: **Left-Right Dimension** (e.g., size)
- `A$(72,8)`: **Top-Bottom Dimension** (e.g., size)
- `A$(80,2)`: **Plys** (e.g., for corrugated items, typically numeric)
- `A$(82,10)`: **Primary Supplier Code**
- `A$(92,4)`: **Plant Code** (associated with Primary Supplier)
- `A$(96,4)`: **Purchase Unit of Measure**
- `A$(100,4)`: **Inventory Unit of Measure**
- `A$(108,1)`: **Item Status** (e.g., 'A'ctive, 'D'iscontinued, 'I'nactive)
- `A$(109,3)`: **Commission Code**
- `A$(112,1)`: **Lot Inventory?** (Y/N Flag)
- `A$(113,3)`: **Quantity Break Pricing Group Code**
- `A$(120,4)`: **Selling Unit of Measure**
- `A$(124,4)`: **Costing Unit of Measure** (used for Base Price, Standard/Last/Avg Cost calculations)
- `A$(128,40)`: **Second Description Line** (Conditional display/use)
- `A$(168,10)`: **Item Group Code** (Conditional display/use)
- `A$(178,10)`: **Pricing Features** (Conditional, linked to Item Group)

**Numeric Fields (`A[index]`):**

- `A[0]`: **Base Price** (associated with Costing U/M)
- `A[1]`: *Purpose TBD (Potentially another cost/price field or a specialized value)*
- `A[2]`: **Quantity Break 1 - Quantity** / **Purchase U/M Factor** (Context-dependent or needs further clarification if overloaded)
- `A[3]`: **Quantity Break 1 - Price** / **Inventory U/M Factor** (Context-dependent or needs further clarification if overloaded)
- `A[4]`: **Quantity Break 2 - Quantity**
- `A[5]`: **Quantity Break 2 - Price**
- `A[6]`: **Quantity Break 3 - Quantity**
- `A[7]`: **Quantity Break 3 - Price**
- `A[8]`: **Quantity Break 4 - Quantity**
- `A[9]`: **Quantity Break 4 - Price**
- `A[10]`: **Quantity Break 5 - Quantity**
- `A[11]`: **Quantity Break 5 - Price**
- `A[12]`: **Quantity Break 6 - Quantity**
- `A[13]`: **Quantity Break 6 - Price**
- `A[14]`: **Selling Pack / Selling U/M Factor** (Factor for Selling U/M relative to Costing U/M)
- `A[15]`: **List Price**
- `A[16]`: **Average Cost**
- `A[17]`: **Last Cost**
- `A[18]`: **Standard Cost**
- `A[19]`: **Item Weight**
- `A[20]`-`A[39]`: Additional numeric fields, likely supporting more quantity breaks, cost components, or other specific item attributes (e.g., inventory adjustment history).

**Known `IC0` Fields Sourced for Sales Order Line Defaults (via `FM2OB5.pxprg`):**

Based on `FM2OB5.pxprg` (around line `5420`), the following `IC0` fields (from buffer `I$`) are used to populate `FS2` (buffer `A$`):

- **String Fields:**
  - `I$(21,40)` (e.g., Item Description) -> `A$(50,40)`
  - `I$(61,21)` (e.g., Item Class / Extended Description) -> `A$(29,21)`
  - `I$(82,10)` (e.g., Default Vendor) -> part of `A$(90,14)`
  - `I$(92,4)` (e.g., Default Plant/Warehouse) -> part of `A$(90,14)`
  - `I$(116,8)` (e.g., UOM related) -> `A$(120,8)`
  - `I$(118,1)` (checked for "USC" to identify TOPS items)
  - `I$(124,4)` (e.g., Specific UOM) -> `A$(120,4)`
- **Numeric/Mapped Fields:**
  - `I[0]`: **Base Price** (associated with Costing U/M) -> `A[4]`
  - `I[14]`: **Cost UOM factor** -> `A[5]`
  - `I[15]`: **List Price or Price UOM factor** -> `A[2]`
  - `I[17]`: **TOPS Cost, conditional use** -> `A[1]`
  - `I[18]`: **Standard Cost** -> `A[1]`
  - `I[19]`: **Item Weight** -> `A[12]`

A comprehensive understanding of all `IC0` fields and their purposes will require analysis of a dedicated Item Master maintenance program or a direct data dictionary dump for `IC0`.

### IC1 - Item Balance/Warehouse File

*   **Programmatic Name:** `IC1`
*   **Key Structure (from IC2TUA, IC2PIU, IC2MAC):** `Customer Code (10) + Item Number (10) + Warehouse Code (4)` (Total 24 bytes). Stored in `A$(1,24)` (IC2MAC), `D$(1,24)` (IC2TUA), `C$(1,24)` (IC2PIU).
*   **Buffer Name Examples:** `A$` & `A[]` (in `IC2MAC`), `D$` & `D[]` (in `IC2TUA`), `J$` & `J[]` (in `FM2ODB`), `C$` & `C[]` (in `IC2PIU`).
*   **IOLIST Examples:** `0310` (full 21 fields) in `IC2MAC`, `0341` in `IC2TUA`, `0400` in `FM2ODB`, `0330/0331` in `IC2PIU`.
*   **String Part (58 bytes total, based on `A$` from `IC2MAC` and cross-referencing `IC2TUA`):
    *   `A$(1,24)`: Key (Customer Code + Item Number + Warehouse Code).
    *   `A$(25,4)`: *Unknown string data* (4 bytes) - Positionally after key, before Last Counted Date.
    *   `A$(29,6)`: **Last Counted Date** (from `IC2MAC` screen; `ZZENTR` to `A$(29+K9,6)`).
    *   `A$(35,10)`: **Bin Location** (from `IC2MAC` screen; `ZZENTR` to `A$(35+K9,10)`).
    *   `A$(45,2)`: **Cycle Number** (from `IC2MAC` screen; `ZZENTR` to `A$(45+K9,2)`).
    *   `A$(47,6)`: **Last Active Date** (from `IC2MAC` screen; `ZZENTR` to `A$(47+K9,6)`).
    *   `A$(53,6)`: **Beginning Balance As Of Date** (from `IC2MAC` screen; `ZZENTR` to `A$(53+K9,6)`).
*   **Numeric Fields (`A[0]`-`A[20]` from `IC2MAC` IOLIST `0310`, maps to `D[]` in `IC2TUA` and `C[]` in `IC2PIU`):
    *   `A[0]`: **Reorder Point** (from `IC2MAC` screen).
    *   `A[1]`: **Last Cost** (from `IC2MAC` screen).
    *   `A[2]`: **Average Cost** (from `IC2MAC` screen).
    *   `A[3]`: **Beginning Balance Quantity** (Period Start) (from `IC2MAC` screen).
    *   `A[4]`: **Quantity Received** (Period) (from `IC2MAC` screen).
    *   `A[5]`: **Quantity Issued/Sold** (Period) (from `IC2MAC` screen).
    *   `A[6]`: **Quantity On Hand** (Current) (from `IC2MAC` screen).
    *   `A[7]`: **Quantity Committed/Allocated** (from `IC2MAC` screen).
    *   `A[8]`: **Quantity on Purchase Order** (from `IC2MAC` screen).
    *   `A[9]`: **Last Count Quantity** (from `IC2MAC` screen; aligns with `IC2PIU`).
    *   `A[10]`: **Reorder Quantity** (from `IC2MAC` screen).
    *   `A[11]`: **Backordered Quantity** (from `IC2MAC` screen).
    *   `A[12]`: **Average Sales/Month** (from `IC2MAC` screen, displayed if `P0$(61,1)="Y"`).
    *   `A[13]`-`A[20]`: Additional numeric fields, likely supporting more inventory control or specific warehouse attributes (e.g., inventory adjustment history).

#### Open Questions for IC1:

*   Exact content of `A$(25,4)` (4-byte string field after the key).
*   The "+/- Adjustments" field displayed on the `IC2MAC` screen is likely a *calculated value for display purposes* (e.g., `Current On Hand - (Opening Balance + Receipts - Issues)`). It does not appear to be a single, directly user-maintainable field within `IC1` via `IC2MAC`, as inventory adjustment transactions in other programs (like `IC2TUA`) directly update the On Hand quantity (`A[6]`/`D[6]`).
*   Purpose and mapping of the remaining numeric fields `A[13]` through `A[20]`. These are not directly maintained through `IC2MAC`'s primary data entry sections and their specific use by other programs is TBD.

## Database Schema

This section outlines the proposed schema for the modernized DemandBridge database, derived from analysis of the legacy system.

### Table: ItemMaster (IC0_Item)
Primary Key: `CUST_DIV`, `CUST_CODE`, `ITEM_CODE`

| Field Name             | Data Type     | Length | Nullable | Foreign Key | Default Value | Notes                                                                      |
|------------------------|---------------|--------|----------|-------------|---------------|----------------------------------------------------------------------------|
| `CUST_DIV`             | VARCHAR       | 2      | No       | YES         |               | Customer Division                                                          |
| `CUST_CODE`            | VARCHAR       | 8      | No       | YES         |               | Customer Code                                                              |
| `ITEM_CODE`            | VARCHAR       | 10     | No       |             |               | Item Code                                                                  |
| `PROD_CODE`            | VARCHAR       | 10     | Yes      |             |               | Product Code                                                               |
| `ITEM_DESC`            | VARCHAR       | 40     | Yes      |             |               | Item Description                                                           |
| `SIZE`                 | VARCHAR       | 8      | Yes      |             |               | Size                                                                       |
| `LEFT_RIGHT`           | VARCHAR       | 8      | Yes      |             |               | Left-Right Dimensions                                                      |
| `TOP_BOTTOM`           | VARCHAR       | 8      | Yes      |             |               | Top to Bottom Dimensions                                                   |
| `PLYS`                 | VARCHAR       | 2      | Yes      |             |               | Number of Plys                                                             |
| `VEND_DIV`             | VARCHAR       | 2      | Yes      | YES         |               | Primary Supplier Division                                                  |
| `VEND_CODE`            | VARCHAR       | 8      | Yes      | YES         |               | Primary Supplier Code                                                      |
| `PLANT_CODE`           | VARCHAR       | 4      | Yes      |             |               | Plant Code                                                                 |
| `LAST_SOLD_DATE`       | DATE          |        | Yes      |             |               | Last Sold Date                                                             |
| `LAST_PURCH_DATE`      | DATE          |        | Yes      |             |               | Last Purchased Date                                                        |
| `STAT_FLAG`            | CHAR          | 1      | Yes      |             |               | Status Flag (I=inactive)                                                   |
| `ITEM_PRICE_CLASS`     | VARCHAR       | 3      | Yes      |             |               | Item Price Class                                                           |
| `LOT_INV_FOR_THIS_ITM` | CHAR          | 1      | Yes      |             |               | Lot Inventory for this item?                                               |
| `QTY_BREAK_PRICE_GRP`  | VARCHAR       | 3      | Yes      |             |               | Quantity Break Price Group                                                 |
| `SECURE_FOR_REQ`       | CHAR          | 1      | Yes      |             |               | Is this a secure form for requisition purposes?                            |
| `NEVER_BACKORDER`      | CHAR          | 1      | Yes      |             |               | Never Backorder?                                                           |
| `TOPS_ITEM`            | CHAR          | 1      | Yes      |             |               | TOPS Item?                                                                 |
| `TAX_TYPE`             | CHAR          | 1      | Yes      |             |               | Tax Type (C=1/2, T=Taxable, E=Exempt, blank=Don't Process)               |
| `SELL_UM`              | VARCHAR       | 4      | Yes      |             |               | Selling Unit of Measure                                                    |
| `INVENTORY_UM`         | VARCHAR       | 4      | Yes      |             |               | Inventory Unit of Measure                                                  |
| `DESC_LINE_2`          | VARCHAR       | 40     | Yes      |             |               | Second Description line                                                    |
| `ITEM_GROUP_CODE`      | VARCHAR       | 10     | Yes      |             |               | Form Group                                                                 |
| `PRICING_FEATURES`     | VARCHAR       | 10     | Yes      |             |               | Pricing Features                                                           |
| `BASE_PRICE`           | DECIMAL(14,3) |        | Yes      |             |               | Base Price                                                                 |
| `QTY_BREAK_1`          | DECIMAL(14,3) |        | Yes      |             |               | Quantity Break 1                                                           |
| `QTY_PRICE_1`          | DECIMAL(14,3) |        | Yes      |             |               | Quantity Price 1                                                           |
| `QTY_BREAK_2`          | DECIMAL(14,3) |        | Yes      |             |               | Quantity Break 2                                                           |
| `QTY_PRICE_2`          | DECIMAL(14,3) |        | Yes      |             |               | Quantity Price 2                                                           |
| `QTY_BREAK_3`          | DECIMAL(14,3) |        | Yes      |             |               | Quantity Break 3                                                           |
| `QTY_PRICE_3`          | DECIMAL(14,3) |        | Yes      |             |               | Quantity Price 3                                                           |
| `QTY_BREAK_4`          | DECIMAL(14,3) |        | Yes      |             |               | Quantity Break 4                                                           |
| `QTY_PRICE_4`          | DECIMAL(14,3) |        | Yes      |             |               | Quantity Price 4                                                           |
| `QTY_BREAK_5`          | DECIMAL(14,3) |        | Yes      |             |               | Quantity Break 5                                                           |
| `QTY_PRICE_5`          | DECIMAL(14,3) |        | Yes      |             |               | Quantity Price 5                                                           |
| `QTY_BREAK_6`          | DECIMAL(14,3) |        | Yes      |             |               | Quantity Break 6                                                           |
| `QTY_PRICE_6`          | DECIMAL(14,3) |        | Yes      |             |               | Quantity Price 6                                                           |
| `QTY_BREAK_7`          | DECIMAL(14,3) |        | Yes      |             |               | Quantity Break 7                                                           |
| `QTY_PRICE_7`          | DECIMAL(14,3) |        | Yes      |             |               | Quantity Price 7                                                           |
| `QTY_BREAK_8`          | DECIMAL(14,3) |        | Yes      |             |               | Quantity Break 8                                                           |
| `QTY_PRICE_8`          | DECIMAL(14,3) |        | Yes      |             |               | Quantity Price 8                                                           |
| `QTY_BREAK_9`          | DECIMAL(14,3) |        | Yes      |             |               | Quantity Break 9                                                           |
| `QTY_PRICE_9`          | DECIMAL(14,3) |        | Yes      |             |               | Quantity Price 9                                                           |
| `QTY_BREAK_10`         | DECIMAL(14,3) |        | Yes      |             |               | Quantity Break 10                                                          |
| `QTY_PRICE_10`         | DECIMAL(14,3) |        | Yes      |             |               | Quantity Price 10                                                          |
| `QTY_BREAK_11`         | DECIMAL(14,3) |        | Yes      |             |               | Quantity Break 11                                                          |
| `QTY_PRICE_11`         | DECIMAL(14,3) |        | Yes      |             |               | Quantity Price 11                                                          |
| `QTY_BREAK_12`         | DECIMAL(14,3) |        | Yes      |             |               | Quantity Break 12                                                          |
| `QTY_PRICE_12`         | DECIMAL(14,3) |        | Yes      |             |               | Quantity Price 12                                                          |
| `AVG_SALE_PR_FOR_FMGT` | DECIMAL(14,3) |        | Yes      |             |               | Average Sales Price for FM (Forms Management)                              |
| `SELL_QTY_PER`         | DECIMAL(14,3) |        | Yes      |             |               | Selling Quantity per Unit                                                  |
| `INVENTORY_QTY_PER`    | DECIMAL(14,3) |        | Yes      |             |               | Inventory Quantity per Unit                                                |
| `CTN_WT`               | DECIMAL(14,3) |        | Yes      |             |               | Carton Weight                                                              |
| `LAST_PURCH_COST`      | DECIMAL(14,3) |        | Yes      |             |               | Last Purchase Cost                                                         |
| `AVG_COST`             | DECIMAL(14,3) |        | Yes      |             |               | Average Cost                                                               |
| `CTN_PACK`             | DECIMAL(14,3) |        | Yes      |             |               | Carton Pack                                                                |
| `SPER_UNIT_COST`       | DECIMAL(14,3) |        | Yes      |             |               | Salesperson Unit Cost                                                      |
| `MIN_QUANTITY`         | DECIMAL(14,3) |        | Yes      |             |               | Minimum Quantity (Schema: IC0_UNUSED_2)                                    |
| `GB_LIFO_COST`         | DECIMAL(14,3) |        | Yes      |             |               | GL LIFO Cost (Schema: IC0_UNUSED_3)                                        |

Alternate Keys:
- `VEND_DIV`, `VEND_CODE`, `PLANT_CODE`, `PROD_CODE`, `CUST_DIV`, `CUST_CODE`, `ITEM_CODE`
- `PROD_CODE`, `CUST_DIV`, `CUST_CODE`, `ITEM_CODE`
- `ITEM_CODE`, `CUST_DIV`, `CUST_CODE`

### Table: ItemLocationInventory (IC1_InventoryLoc)
Primary Key: `CUST_DIV`, `CUST_CODE`, `ITEM_CODE`, `LOC_CODE`

| Field Name               | Data Type     | Length | Nullable | Foreign Key | Default Value | Notes                                                     |
|--------------------------|---------------|--------|----------|-------------|---------------|-----------------------------------------------------------|
| `CUST_DIV`               | VARCHAR       | 2      | No       | YES         |               | Customer Division                                         |
| `CUST_CODE`              | VARCHAR       | 8      | No       | YES         |               | Customer Code                                             |
| `ITEM_CODE`              | VARCHAR       | 10     | No       | YES         |               | Item Code (FK to IC0_Item)                                |
| `LOC_CODE`               | VARCHAR       | 4      | No       | YES         |               | Location Code                                             |
| `VARIABLE_SIZE_LOT_YN`   | CHAR          | 1      | Yes      |             |               | Variable size lots found (for ICG use)                    |
| `LAST_CNT_DATE`          | DATE          |        | Yes      |             |               | Last Counted Date                                         |
| `BIN_LOC`                | VARCHAR       | 10     | Yes      |             |               | Bin Location                                              |
| `CYCLE_NUM`              | VARCHAR       | 2      | Yes      |             |               | Cycle Number                                              |
| `LAST_ACTIVE_DATE`       | DATE          |        | Yes      |             |               | Last Active Date                                          |
| `BEG_BAL_AS_OF_DATE`     | DATE          |        | Yes      |             |               | Beginning Balance As Of Date                              |
| `RO_PT`                  | DECIMAL(14,3) |        | Yes      |             |               | Reorder Point                                             |
| `LAST_COST`              | DECIMAL(14,3) |        | Yes      |             |               | Last Cost                                                 |
| `AVG_COST`               | DECIMAL(14,3) |        | Yes      |             |               | Average Cost                                              |
| `BEG_BAL`                | DECIMAL(14,3) |        | Yes      |             |               | Beginning Balance                                         |
| `RECEIPTS`               | DECIMAL(14,3) |        | Yes      |             |               | Receipts                                                  |
| `SALES`                  | DECIMAL(14,3) |        | Yes      |             |               | Sales                                                     |
| `ADJUSTMENTS`            | DECIMAL(14,3) |        | Yes      |             |               | Adjustments                                               |
| `TF_COMMITTED`           | DECIMAL(14,3) |        | Yes      |             |               | Committed Quantity                                        |
| `ON_PO`                  | DECIMAL(14,3) |        | Yes      |             |               | On Purchase Order Quantity                                |
| `LAST_PHYS_CNT`          | DECIMAL(14,3) |        | Yes      |             |               | Last Physical Count                                       |
| `RO_QTY`                 | DECIMAL(14,3) |        | Yes      |             |               | Reorder Quantity                                          |
| `BO_QTY`                 | DECIMAL(14,3) |        | Yes      |             |               | Backorder Quantity                                        |
| `CTN_CNT_IN_ICG`         | DECIMAL(14,3) |        | Yes      |             |               | Carton Count in ICG                                       |
| `COMMIT_BY_KIT_PRD_PR`   | DECIMAL(14,3) |        | Yes      |             |               | Committed By Kit Production Posting                       |

### Table: `IC3_PhyCntEnt` - Physical Count Entry

This table stores data related to physical inventory counts.

| Field Name             | Data Type   | Length | Dec | Notes                         |
| :--------------------- | :---------- | :----- | :-- | :---------------------------- |
| `LOC_CODE`             | CHAR        | 4      |     | Location                      |
| `BIN_LOC`              | CHAR        | 10     |     | Bin Location                  |
| `CUST_DIV`             | CHAR        | 2      |     | Item Code (part of composite) |
| `CUST_CODE`            | CHAR        | 8      |     |                               |
| `ITEM_CODE`            | CHAR        | 10     |     | Item number                    |
| `SEQ_NUM`              | CHAR        | 1      |     | Sequence                      |
| `COMP_CNT_UM`          | CHAR        | 4      |     | Computer Count Unit           |
| `PHYS_CNT_UM`          | CHAR        | 4      |     | Physical Count Unit           |
| `NEW_BIN_LOC`          | CHAR        | 10     |     | New Bin Location              |
| `COMP_CNT`             | NUMBER      | 14     | 3   | Computer count                |
| `COMP_CNT_QTY_PER`     | NUMBER      | 14     | 3   | Computer Count Qty per Unit   |
| `PHYS_CNT`             | NUMBER      | 14     | 3   | Physical Count                |
| `PHYS_CNT_QTY_PER`     | NUMBER      | 14     | 3   | Physical Count Qty per Unit   |
| `FREEZE_TIME_AVG_COST` | NUMBER      | 14     | 3   | Freeze Time Ave Cost          |

**Keys:**
- Primary Key: `LOC_CODE`, `BIN_LOC`, `CUST_DIV`, `CUST_CODE`, `ITEM_CODE`, `SEQ_NUM`

### Table: `IC8_InventoryTrans` - Inventory Transactions

This table records inventory transaction details.

| Field Name     | Data Type | Length | Dec | Notes                                       |
| :------------- | :-------- | :----- | :-- | :------------------------------------------ |
| `CUST_DIV`     | CHAR      | 2      |     | Item number (part of composite)             |
| `CUST_CODE`    | CHAR      | 8      |     |                                             |
| `ITEM_CODE`    | CHAR      | 10     |     |                                             |
| `LOC_CODE`     | CHAR      | 4      |     | Location                                    |
| `FY`           | CHAR      | 4      |     | Fiscal year                                 |
| `ACCTPD`       | CHAR      | 2      |     | Accounting period                           |
| `TRANS_DATE`   | DATE      | 6      |     | Transaction date                            |
| `SEQ_NUM`      | CHAR      | 2      |     | Sequence number                             |
| `TRANS_CODE`   | CHAR      | 1      |     | Trans code (Trans,Iss,Sal,Com,Rec,Adj,PO) |
| `CSVD_DIV`     | CHAR      | 2      |     | Vendor/Customer (part of composite)         |
| `CSVD_CODE`    | CHAR      | 8      |     |                                             |
| `TF_REF`       | CHAR      | 15     |     | Reference                                   |
| `SRC_JRNL`     | CHAR      | 2      |     | Source journal                              |
| `AUDIT_NUM`    | CHAR      | 6      |     | Audit control #                             |
| `IC8_UNUSED_1` | CHAR      | 1      |     |                                             |
| `QTY`          | NUMBER    | 14     | 3   | Quantity                                    |
| `AMT`          | NUMBER    | 14     | 3   | Amount                                      |

**Keys:**
- Primary Key: `CUST_DIV`, `CUST_CODE`, `ITEM_CODE`, `LOC_CODE`, `FY`, `ACCTPD`, `TRANS_DATE`, `SEQ_NUM`

### Table: `IC9_ItemStats` - Item Statistics

This table holds statistical data for items, likely on a periodic basis.

| Field Name      | Data Type | Length | Dec | Notes                             |
| :-------------- | :-------- | :----- | :-- | :-------------------------------- |
| `CUST_DIV`      | CHAR      | 2      |     | Item code (part of composite)     |
| `CUST_CODE`     | CHAR      | 8      |     |                                   |
| `ITEM_CODE`     | CHAR      | 10     |     | Item number                        |
| `LOC_CODE`      | CHAR      | 4      |     | Location code                     |
| `FY`            | CHAR      | 4      |     | Fiscal year                       |
| `BAL_TYPE`      | CHAR      | 1      |     | Balance type                      |
| `OPEN_BAL`      | NUMBER    | 14     | 3   | Opening balance                   |
| `PERIOD_AMT_1`  | NUMBER    | 14     | 3   | Amount Period 1                   |
| `PERIOD_AMT_2`  | NUMBER    | 14     | 3   | Amount Period 2                   |
| `PERIOD_AMT_3`  | NUMBER    | 14     | 3   | Amount Period 3                   |
| `PERIOD_AMT_4`  | NUMBER    | 14     | 3   | Amount Period 4                   |
| `PERIOD_AMT_5`  | NUMBER    | 14     | 3   | Amount Period 5                   |
| `PERIOD_AMT_6`  | NUMBER    | 14     | 3   | Amount Period 6                   |
| `PERIOD_AMT_7`  | NUMBER    | 14     | 3   | Amount Period 7                   |
| `PERIOD_AMT_8`  | NUMBER    | 14     | 3   | Amount Period 8                   |
| `PERIOD_AMT_9`  | NUMBER    | 14     | 3   | Amount Period 9                   |
| `PERIOD_AMT_10` | NUMBER    | 14     | 3   | Amount Period 10                  |
| `PERIOD_AMT_11` | NUMBER    | 14     | 3   | Amount Period 11                  |
| `PERIOD_AMT_12` | NUMBER    | 14     | 3   | Amount Period 12                  |
| `PERIOD_AMT_13` | NUMBER    | 14     | 3   | Amount Period 13                  |

**Keys:**
- Primary Key: `CUST_DIV`, `CUST_CODE`, `ITEM_CODE`, `LOC_CODE`, `FY`, `BAL_TYPE`

### Table: `ICA_TransEntHdr` - Transaction Entry Header

This table appears to store header information for transaction entries, possibly linking to lot details in `ICF_Lots`.

| Field Name       | Data Type | Length | Dec | Notes                                  |
| :--------------- | :-------- | :----- | :-- | :------------------------------------- |
| `FY`             | CHAR      | 4      |     | Fiscal year                            |
| `ACCTPD`         | CHAR      | 2      |     | Accounting Period                      |
| `REF_NUM`        | CHAR      | 6      |     | Reference code                         |
| `REMARK`         | CHAR      | 40     |     | Remark                                 |
| `ICA_UNUSED_1`   | CHAR      | 1      |     | not used?                              |
| `HIGH_SEQ_NUM`   | CHAR      | 3      |     | Highest sequence number for ICF (Lots) |

**Keys:**
- Primary Key: `FY`, `ACCTPD`, `REF_NUM`

### Table: `ICF_Lots` - Inventory Lots

This table stores detailed information about inventory lots.

| Field Name                | Data Type | Length | Dec | Notes                                     |
| :------------------------ | :-------- | :----- | :-- | :---------------------------------------- |
| `CUST_DIV`                | CHAR      | 2      |     | Customer number (part of composite)       |
| `CUST_CODE`               | CHAR      | 8      |     |                                           |
| `ITEM_CODE`               | CHAR      | 10     |     | Item number                               |
| `LOC_CODE`                | CHAR      | 4      |     | Location code                             |
| `RECEIPT_DATE`            | DATE      | 6      |     | Receipt date                              |
| `SEQ_NUM`                 | CHAR      | 2      |     | Sequence no                               |
| `RECVG_REPORT_NUM`        | CHAR      | 8      |     | Receiving report                          |
| `PO_DIV`                  | CHAR      | 2      |     | P/O number (part of composite)            |
| `PO_NUM`                  | CHAR      | 7      |     |                                           |
| `PO_DATE`                 | DATE      | 6      |     | P/O date                                  |
| `FACTORY_JOB_NUM`         | CHAR      | 12     |     | Factory Job                               |
| `VEND_DIV`                | CHAR      | 2      |     | Vendor Number                             |
| `VEND_CODE`               | CHAR      | 8      |     |                                           |
| `PLANT_CODE`              | CHAR      | 4      |     | Plant number                              |
| `STARTING_NUM`            | CHAR      | 9      |     | Starting number                           |
| `ENDING_NUM`              | CHAR      | 9      |     | Ending number                             |
| `BIN_LOC`                 | CHAR      | 10     |     | Bin number                                |
| `ORDER_DIV`               | CHAR      | 2      |     | Order number                              |
| `ORDER_NUM`               | CHAR      | 6      |     |                                           |
| `ORDER_LINE_NUM`          | CHAR      | 3      |     | Line number on order                      |
| `PRIMARY_UM`              | CHAR      | 4      |     | Main uom (1st pack)                       |
| `PACKAGING_UM`            | CHAR      | 4      |     | Packaging unit                            |
| `SELL_UM`                 | CHAR      | 4      |     | Selling Unit of Measure                   |
| `CUST_PO`                 | CHAR      | 15     |     | Customer PO                               |
| `INV_NUM`                 | CHAR      | 7      |     | Billed on invoice number                  |
| `SHORT_OR_BROKEN_CTN`     | CHAR      | 1      |     | Y = Short or broken carton                |
| `TF_COMMENT`              | CHAR      | 40     |     | Comment field                             |
| `RECVG_AUDIT_NUM`         | CHAR      | 6      |     | Received audit control number             |
| `RELEASED_ON_INV_NUM`     | CHAR      | 7      |     | Released on invoice number                |
| `RELEASED_AUDIT_NUM`      | CHAR      | 6      |     | Released Audit Control number             |
| `ITEM_REV_DATE`           | CHAR      | 6      |     | Form Revision Date                        |
| `TRANS_IN_PROCESS_LNK`    | CHAR      | 11     |     | Transaction/PhyInv in process link        |
| `PHYS_INV_LINK_TO_ICL`    | CHAR      | 2      |     | Physical Inventory Link to ICL            |
| `ORIG_OPER_ENTERED`       | CHAR      | 3      |     | Original Operator Entered                 |
| `ORIG_DATE_ENTERED`       | DATE      | 6      |     | Original Date Entered                     |
| `ORIG_TIME_ENTERED`       | CHAR      | 4      |     | Original Time Entered                     |
| `LAST_OPER_CHANGED`       | CHAR      | 3      |     | Last Operator Changed                     |
| `LAST_DATE_CHANGED`       | DATE      | 6      |     | Last Date Changed                         |
| `LAST_TIME_CHANGED`       | CHAR      | 4      |     | Last Time Changed                         |
| `LOT_SLSP`                | CHAR      | 4      |     | Salesperson code                          |
| `ICF_SEQ_NUM`             | CHAR      | 2      |     | Seq Number from ICF Lot record            |
| `ICL_UNUSED_1`            | CHAR      | 2      |     |                                           |
| `TOTAL_COST`              | NUMBER    | 14     | 3   | Total cost                                |
| `TOTAL_FRT`               | NUMBER    | 14     | 3   | Total Freight                             |
| `UNITS_PER_PACK`          | NUMBER    | 14     | 3   | Units Per Pack                            |
| `UNITS_PER_UNIT`          | NUMBER    | 14     | 3   | Units Per Unit                            |
| `QTY`                     | NUMBER    | 14     | 3   | Quantity                                  |
| `SELL_PRICE`              | NUMBER    | 14     | 3   | Sell Price                                |
| `UNITS_PER_UM`            | NUMBER    | 14     | 3   | Units Per UM                              |
| `STND_UNIT_COST`          | NUMBER    | 14     | 3   | Standard Unit Cost                        |
| `STND_UNIT_COST_QTY`      | NUMBER    | 14     | 3   | Standard Unit Cost Qty                    |
| `FMS_PRICE`               | NUMBER    | 14     | 3   | IMS Price                                 |
| `CUST_PO_TP`              | NUMBER    | 14     | 3   | Customer Supplied PO Type 1=Yes           |
| `TF_STORAGE`              | NUMBER    | 14     | 3   | Total Storage Cost                        |
| `FINANCE`                 | NUMBER    | 14     | 3   | Total finance cost                        |

**Keys:**
- Primary Key: `CUST_DIV`, `CUST_CODE`, `ITEM_CODE`, `LOC_CODE`, `RECEIPT_DATE`, `SEQ_NUM`
- Alternate Key 1: `CUST_DIV`, `CUST_CODE`, `ITEM_CODE`, `LOC_CODE`, `LOT_NUM`, `RECEIPT_DATE`, `SEQ_NUM`
- Alternate Key 2: `PO_DIV`, `PO_NUM`, `PO_LINE_NO`, `CUST_DIV`, `CUST_CODE`, `ITEM_CODE`, `LOC_CODE`, `RECEIPT_DATE`, `SEQ_NUM`
- Alternate Key 3: `ORDER_DIV`, `ORDER_NUM`, `ORDER_LINE_NUM`, `CUST_DIV`, `CUST_CODE`, `ITEM_CODE`, `LOC_CODE`, `RECEIPT_DATE`, `SEQ_NUM`
- Alternate Key 4: `LOT_NUM`, `CUST_DIV`, `CUST_CODE`, `ITEM_CODE`, `LOC_CODE`, `RECEIPT_DATE`, `SEQ_NUM`
- Alternate Key 5: `BIN_LOC`, `CUST_DIV`, `CUST_CODE`, `ITEM_CODE`, `LOC_CODE`, `RECEIPT_DATE`, `SEQ_NUM`
- Alternate Key 6: `ITEM_CODE`, `LOT_NUM`, `BIN_LOC`, `CUST_DIV`, `CUST_CODE`, `LOC_CODE`, `RECEIPT_DATE`, `SEQ_NUM`

### Table: `ICG_FrozenInventory` - Frozen Inventory Snapshot

This table likely captures a snapshot of inventory levels at a specific point in time, often used for physical counts or period-end reporting.

| Field Name                | Data Type | Length | Dec | Notes                                     |
| :------------------------ | :-------- | :----- | :-- | :---------------------------------------- |
| `CUST_DIV`                | CHAR      | 2      |     | Item Code                                 |
| `CUST_CODE`               | CHAR      | 8      |     |                                           |
| `ITEM_CODE`               | CHAR      | 10     |     |                                           |
| `LOC_CODE`                | CHAR      | 4      |     | Location                                  |
| `VARIABLE_SIZE_LOT_YN`    | CHAR      | 1      |     | Variable size lots found (for ICG use)    |
| `ICG_UNUSED_1`            | CHAR      | 3      |     | *Unused                                   |
| `LAST_CNT_DATE`           | DATE      | 6      |     | Last counted                              |
| `BIN_LOC`                 | CHAR      | 10     |     | Bin Location                              |
| `CYCLE_NUM`               | CHAR      | 2      |     | Cycle number                              |
| `LAST_ACTIVE_DATE`        | DATE      | 6      |     | Last Active Date                          |
| `BEG_BAL_AS_OF_DATE`      | DATE      | 6      |     | Beginning balance as of date              |
| `ICG_UNUSED_2`            | CHAR      | 1      |     |                                           |
| `RO_PT`                   | NUMBER    | 14     | 3   | Reorder point                             |
| `LAST_COST`               | NUMBER    | 14     | 3   | Last Cost                                 |
| `AVG_COST`                | NUMBER    | 14     | 3   | Average Cost                              |
| `BEG_BAL`                 | NUMBER    | 14     | 3   | Beginning Balance                         |
| `RECEIPTS`                | NUMBER    | 14     | 3   | Receipts                                  |
| `SALES`                   | NUMBER    | 14     | 3   | Sales                                     |
| `ADJUSTMENTS`             | NUMBER    | 14     | 3   | Adjustments                               |
| `TF_COMMITTED`            | NUMBER    | 14     | 3   | Committed Quantity                        |
| `ON_PO`                   | NUMBER    | 14     | 3   | On Purchase Order Quantity                |
| `LAST_PHYS_CNT`           | NUMBER    | 14     | 3   | Last Physical Count                       |
| `RO_QTY`                  | NUMBER    | 14     | 3   | Reorder Quantity                          |
| `BO_QTY`                  | NUMBER    | 14     | 3   | Backorder Quantity                        |
| `CTN_CNT_IN_ICG`          | NUMBER    | 14     | 3   | Carton Count in ICG                       |
| `COMMIT_BY_KIT_PRD_PR`    | NUMBER    | 14     | 3   | Committed By Kit Production Posting       |
| `ICG_UNUSED_3`            | NUMBER    | 14     | 3   | ICG Unused 3                              |
| `ICG_UNUSED_4`            | NUMBER    | 14     | 3   | ICG Unused 4                              |
| `ICG_UNUSED_5`            | NUMBER    | 14     | 3   | ICG Unused 5                              |
| `ICG_UNUSED_6`            | NUMBER    | 14     | 3   | ICG Unused 6                              |
| `ICG_UNUSED_7`            | NUMBER    | 14     | 3   | ICG Unused 7                              |
| `ICG_UNUSED_8`            | NUMBER    | 14     | 3   | ICG Unused 8                              |
| `ICG_UNUSED_9`            | NUMBER    | 14     | 3   | ICG Unused 9                              |

**Keys:**
- Primary Key: `CUST_DIV`, `CUST_CODE`, `ITEM_CODE`, `LOC_CODE`

### Table: `ICL_PhyCntLotEnt` - Physical Count Lot Entry

This table appears to store data related to physical inventory counts, specifically for lotted items. It links lot details with count information.

| Field Name                | Data Type | Length | Dec | Notes                                     |
| :------------------------ | :-------- | :----- | :-- | :---------------------------------------- |
| `CUST_DIV`                | CHAR      | 2      |     | Customer number                           |
| `CUST_CODE`               | CHAR      | 8      |     |                                           |
| `ITEM_CODE`               | CHAR      | 10     |     | Item number                               |
| `LOC_CODE`                | CHAR      | 4      |     | Location code                             |
| `RECEIPT_DATE`            | DATE      | 6      |     | Receipt date                              |
| `SEQ_NUM`                 | CHAR      | 2      |     | Sequence no                               |
| `RECVG_REPORT`            | CHAR      | 8      |     | Receiving report                          |
| `PO_DIV`                  | CHAR      | 2      |     | P/O number                                |
| `PO_NUM`                  | CHAR      | 7      |     |                                           |
| `PO_DATE`                 | DATE      | 6      |     | P/O date                                  |
| `FACTORY_JOB_NUM`         | CHAR      | 12     |     | Factory Job                               |
| `VEND_DIV`                | CHAR      | 2      |     | Vendor Number                             |
| `VEND_CODE`               | CHAR      | 8      |     |                                           |
| `PLANT_CODE`              | CHAR      | 4      |     | Plant number                              |
| `STARTING_NUM`            | CHAR      | 9      |     | Starting number                           |
| `ENDING_NUM`              | CHAR      | 9      |     | Ending number                             |
| `BIN_LOC`                 | CHAR      | 10     |     | Bin number                                |
| `ORDER_DIV`               | CHAR      | 2      |     | Order number                              |
| `ORDER_NUM`               | CHAR      | 6      |     |                                           |
| `ORDER_LINE_NUM`          | CHAR      | 3      |     | Line number on order                      |
| `PRIMARY_UM`              | CHAR      | 4      |     | Primary unit (Comp unit if non lot)       |
| `PACKAGING_UM`            | CHAR      | 4      |     | Packaging unit                            |
| `UM`                      | CHAR      | 4      |     | U/M                                       |
| `CUST_PO`                 | CHAR      | 15     |     | Customer PO                               |
| `INV_NUM`                 | CHAR      | 7      |     | Billed on invoice number                  |
| `SHORT_OR_BROKEN`         | CHAR      | 1      |     | Y = Short or broken carton                |
| `TF_COMMENT`              | CHAR      | 40     |     | Comment field                             |
| `RECVG_AUDIT_NUM`         | CHAR      | 6      |     | Received audit control number             |
| `RELEASED_ON_INV_NUM`     | CHAR      | 7      |     | Released on invoice number                |
| `RELEASED_AUDIT_NUM`      | CHAR      | 6      |     | Released Audit Control number             |
| `ITEM_REV_DATE`           | CHAR      | 6      |     | Form Revision Date                        |
| `LOTTED_INV_ITEM`         | CHAR      | 1      |     | Lotted inventory item?                    |
| `PHYS_CNT_ENTERED`        | CHAR      | 1      |     | Physical count entered? YN or S for skip  |
| `PHYS_UM_NONLOT_1`        | CHAR      | 4      |     | Phys UM 1 for non-lot items               |
| `PHYS_UM_NONLOT_2`        | CHAR      | 4      |     | Physical UM 2 for non-lotted items        |
| `PHYS_UM_NONLOT_3`        | CHAR      | 4      |     | Physical UM 3 for non-lotted items        |
| `INV_TAG_NUM`             | CHAR      | 12     |     | Inventory Tag Number                      |
| `NEW_BIN_LOC`             | CHAR      | 10     |     | New Bin Location                          |
| `PHYS_INV_LINK_TO_ICF`    | CHAR      | 2      |     | Physical Inventory Link to ICF            |
| `ORIG_OPER_ENTERED`       | CHAR      | 3      |     | Original Operator Entered                 |
| `ORIG_DATE_ENTERED`       | DATE      | 6      |     | Original Date Entered                     |
| `ORIG_TIME_ENTERED`       | CHAR      | 4      |     | Original Time Entered                     |
| `LAST_OPER_CHANGED`       | CHAR      | 3      |     | Last Operator Changed                     |
| `LAST_DATE_CHANGED`       | DATE      | 6      |     | Last Date Changed                         |
| `LAST_TIME_CHANGED`       | CHAR      | 4      |     | Last Time Changed                         |
| `LOT_SLSP`                | CHAR      | 4      |     | Salesperson code - from the ICF Lot record|
| `ICF_SEQ_NUM`             | CHAR      | 2      |     | Seq Number from ICF Lot record            |
| `ICL_UNUSED_1`            | CHAR      | 2      |     |                                           |
| `TOTAL_COST`              | NUMBER    | 14     | 3   | Total cost (avg cost if non lot)          |
| `TOTAL_FRT`               | NUMBER    | 14     | 3   | Total Freight                             |
| `UNITS_PER_PACK`          | NUMBER    | 14     | 3   | Units Per Pack                            |
| `UNITS_PER_UNIT`          | NUMBER    | 14     | 3   | Units Per Unit                            |
| `QTY`                     | NUMBER    | 14     | 3   | Quantity                                  |
| `SELL_PRICE`              | NUMBER    | 14     | 3   | Sell Price                                |
| `UNITS_PER_UM`            | NUMBER    | 14     | 3   | Units Per UM                              |
| `PHYS_UM_1`               | NUMBER    | 14     | 3   | Phys UM 1                                 |
| `PHYS_QTY_1`              | NUMBER    | 14     | 3   | Phy Qty 1                                 |
| `PHYS_UM_2`               | NUMBER    | 14     | 3   | Phys UM 2                                 |
| `PHYS_QTY_2`              | NUMBER    | 14     | 3   | Phys Qty 2                                |
| `PHYS_UM_3`               | NUMBER    | 14     | 3   | Phys UM 3                                 |
| `PHYS_QTY_3`              | NUMBER    | 14     | 3   | Phys Qty 3                                |

**Keys:**
- Primary Key: `LOC_CODE`, `BIN_LOC`, `CUST_DIV`, `CUST_CODE`, `ITEM_CODE`, `RECEIPT_DATE`, `SEQ_NUM`
- Alternate Key 1: `LOT_SLSP`, `CUST_DIV`, `CUST_CODE`, `ITEM_CODE`, `SEQ_NUM`, `LOC_CODE`, `BIN_LOC`, `RECEIPT_DATE`
- Alternate Key 2: `PHYS_CNT_ENTERED`, `LOC_CODE`, `BIN_LOC`, `CUST_DIV`, `CUST_CODE`, `ITEM_CODE`, `RECEIPT_DATE`, `ICF_SEQ_NUM`

### Table: `ICM_ItemDetPO` - Item Detail P/O

This table likely stores detailed information about items related to specific purchase orders.

| Field Name             | Data Type | Length | Dec | Notes                  |
| :--------------------- | :-------- | :----- | :-- | :--------------------- |
| `CUST_DIV`             | CHAR      | 2      |     | Customer Number        |
| `CUST_CODE`            | CHAR      | 8      |     |                        |
| `ITEM_CODE`            | CHAR      | 10     |     | Item Number            |
| `PO_DIV`               | CHAR      | 2      |     | P/O Number             |
| `PO_NUM`               | CHAR      | 7      |     |                        |
| `WHSE`                 | CHAR      | 4      |     | Warehouse              |
| `ICM_UNUSED_1`         | CHAR      | 1      |     | *Unused                |
| `STARTING_DATE_FOR_DATA` | DATE    | 6      |     | Starting date for data |
| `ENDING_DATE_FOR_DATA`   | DATE    | 6      |     | Ending date for data   |
| `FACTORY_JOB_NUM`       | CHAR      | 12     |     | Factory Job No.        |
| `REV_DATE`               | CHAR      | 6      |     | Rev date               |
| `SELL_UM`                | CHAR      | 4      |     | U/M                    |
| `ENDING_BAL`             | NUMBER    | 14     | 3   | Ending balance         |
| `TOTAL_VALUE`            | NUMBER    | 14     | 3   | Total Value            |
| `ADJUSTMENTS`            | NUMBER    | 14     | 3   | Adjustments            |
| `RECEIPTS`               | NUMBER    | 14     | 3   | Receipts               |
| `TRANSFERS`              | NUMBER    | 14     | 3   | Transfers              |
| `ISSUES_REQS`            | NUMBER    | 14     | 3   | Issues/Requisitions    |
| `DIRECT_SHIP`            | NUMBER    | 14     | 3   | Direct Ship            |
| `SPECIAL_QTY`            | NUMBER    | 14     | 3   | Special Qty            |
| `SELL_PRICE`             | NUMBER    | 14     | 3   | Sell Price             |
| `SELL_QTY_PER`           | NUMBER    | 14     | 3   | Sell Qty per UM        |

**Keys:**
- Primary Key: `CUST_DIV`, `CUST_CODE`, `ITEM_CODE`, `PO_DIV`, `PO_NUM`, `WHSE`, `ICM_UNUSED_1`

### Table: `ICN_OrderEntLotRet` - Order Entry Lot Return

This table appears to handle lot information related to order entry returns.

| Field Name             | Data Type | Length | Dec | Notes                                  |
| :--------------------- | :-------- | :----- | :-- | :------------------------------------- |
| `CUST_DIV`             | CHAR      | 2      |     | Customer number                        |
| `CUST_CODE`            | CHAR      | 8      |     |                                        |
| `ITEM_CODE`            | CHAR      | 10     |     | Item number                            |
| `LOC_CODE`             | CHAR      | 4      |     | Location code                          |
| `RECEIPT_DATE`         | DATE      | 6      |     | Receipt date                           |
| `SEQ_NUM`              | CHAR      | 2      |     | Sequence no                            |
| `RECVG_REPORT`         | CHAR      | 8      |     | Receiving report                       |
| `PO_DIV`               | CHAR      | 2      |     | P/O number                             |
| `PO_NUM`               | CHAR      | 7      |     |                                        |
| `PO_DATE`              | DATE      | 6      |     | P/O date                               |
| `FACTORY_JOB_NUM`      | CHAR      | 12     |     | Factory Job                            |
| `VEND_DIV`             | CHAR      | 2      |     | Vendor Number                          |
| `VEND_CODE`            | CHAR      | 8      |     |                                        |
| `PLANT_CODE`           | CHAR      | 4      |     | Plant number                           |
| `STARTING_NUM`         | CHAR      | 9      |     | Starting number                        |
| `ENDING_NUM`           | CHAR      | 9      |     | Ending number                          |
| `BIN_LOC`              | CHAR      | 10     |     | Bin number                             |
| `ORDER_DIV`            | CHAR      | 2      |     | Order number                           |
| `ORDER_NUM`            | CHAR      | 6      |     |                                        |
| `ORDER_LINE_NUM`       | CHAR      | 3      |     | Line number on order                   |
| `PRIMARY_UM`           | CHAR      | 4      |     | Primary unit                           |
| `PACKAGING_UM`         | CHAR      | 4      |     | Packaging unit                         |
| `UM`                   | CHAR      | 4      |     | U/M                                    |
| `CUST_PO`              | CHAR      | 15     |     | Customer PO                            |
| `INV_NUM`              | CHAR      | 7      |     | Billed on invoice number               |
| `SHORT_OR_BROKEN`      | CHAR      | 1      |     | Y = Short or broken carton             |
| `TF_COMMENT`           | CHAR      | 40     |     | Comment field                          |
| `RECVG_AUDIT_NUM`      | CHAR      | 6      |     | Received audit control number          |
| `RELEASED_ON_INV_NUM`  | CHAR      | 7      |     | Released on invoice number             |
| `RELEASED_AUDIT_NUM`   | CHAR      | 6      |     | Released Audit Control number          |
| `ITEM_REV_DATE`        | CHAR      | 6      |     | Form Revision Date                     |
| `ICN_UNUSED_1`         | CHAR      | 13     |     | *DO NOT USE - USED in ICF for flags    |
| `LOT_NUM`              | CHAR      | 8      |     | Lot Number (4.0)                       |
| `PROD_CODE`            | CHAR      | 3      |     | Product Code                           |
| `COMM_CODE`            | CHAR      | 5      |     | Commission Code                        |
| `STORAGE_EXP_DATE`     | DATE      | 6      |     | Storage Expiration Date                |
| `STND_COST_UOM`        | CHAR      | 4      |     | Standard Cost Unit of Measure          |
| `ICN_UNUSED_2`         | CHAR      | 10     |     | *Ununsed                               |
| `TOTAL_COST`           | NUMBER    | 14     | 3   | Total cost                             |
| `TOTAL_FRT`            | NUMBER    | 14     | 3   | Total Freight                          |
| `UNITS_PER_PACK`       | NUMBER    | 14     | 3   | Units Per Pack                         |
| `UNITS_PER_PRIMARY`    | NUMBER    | 14     | 3   | Units Per Primary Packing Unit         |
| `ORDER_QTY`            | NUMBER    | 14     | 3   | Order Qty                              |
| `ORDER_SALES_PRICE`    | NUMBER    | 14     | 3   | Order Sales Price                      |
| `SALES_PRICE_QTY_UM`   | NUMBER    | 14     | 3   | Sales Price Qty UM                     |
| `STND_UNIT_COST`       | NUMBER    | 14     | 3   | Standard Unit Cost                     |
| `STND_COST_QTY`        | NUMBER    | 14     | 3   | Standard Cost Qty                      |
| `ICN_UNUSED_3`         | NUMBER    | 14     | 3   | ICN Unused 3                           |
| `ICN_UNUSED_4`         | NUMBER    | 14     | 3   | ICN Unused 4                           |
| `ICN_UNUSED_5`         | NUMBER    | 14     | 3   | ICN Unused 5                           |
| `ICN_UNUSED_6`         | NUMBER    | 14     | 3   | ICN Unused 6                           |

**Keys:**
- Primary Key: `CUST_DIV`, `CUST_CODE`, `ITEM_CODE`, `LOC_CODE`, `RECEIPT_DATE`, `SEQ_NUM`

### Table: `ICO_InventoryLotTrans` - Inventory Lot Transaction

This table appears to track transactions related to inventory lots, covering fiscal periods, purchase orders, and various transaction types.

| Field Name             | Data Type | Length | Dec | Notes                                  |
| :--------------------- | :-------- | :----- | :-- | :------------------------------------- |
| `INV_LOT_FY`           | CHAR      | 4      |     | Fiscal year                            |
| `INV_LOT_ACCTPD`       | CHAR      | 2      |     | Accounting Period                      |
| `CUST_DIV`             | CHAR      | 2      |     | Customer Number                        |
| `CUST_CODE`            | CHAR      | 8      |     |                                        |
| `ITEM_CODE`            | CHAR      | 10     |     | Item Number                            |
| `LOC_CODE`             | CHAR      | 4      |     | Location code                          |
| `SEQ_NUM`              | CHAR      | 4      |     | Sequence Number                        |
| `TRANS_DATE`           | DATE      | 6      |     | Transaction date                       |
| `INV_LOT_PO_NUM`       | CHAR      | 9      |     | P/O number                             |
| `INV_LOT_PO_DATE`      | DATE      | 6      |     | P/O date                               |
| `FACTORY_JOB_NUM`      | CHAR      | 12     |     | Factory Job                            |
| `VEND_DIV`             | CHAR      | 2      |     | Vendor Number                          |
| `VEND_CODE`            | CHAR      | 8      |     |                                        |
| `PLANT_CODE`           | CHAR      | 4      |     | Plant number                           |
| `STARTING_NUM`         | CHAR      | 9      |     | Starting number                        |
| `ENDING_NUM`           | CHAR      | 9      |     | Ending number                          |
| `BIN_LOC`              | CHAR      | 10     |     | Bin number                             |
| `ORDER_DIV`            | CHAR      | 2      |     | Order number                           |
| `ORDER_NUM`            | CHAR      | 6      |     |                                        |
| `ORDER_LINE_NUM`       | CHAR      | 3      |     | Line number on order                   |
| `PRIMARY_UM`           | CHAR      | 4      |     | Primary unit                           |
| `PACKAGING_UM`         | CHAR      | 4      |     | Packaging unit                         |
| `SELL_UM`              | CHAR      | 4      |     | Selling Unit of Measure                |
| `CUST_PO`              | CHAR      | 15     |     | Customer PO                            |
| `BILLED_ON_INV_NUM`    | CHAR      | 7      |     | Billed on invoice number               |
| `SHORT_OR_BROKEN_CTN`  | CHAR      | 1      |     | Y = Short or broken carton             |
| `TF_COMMENT`           | CHAR      | 40     |     | Comment field                          |
| `RECVD_AUDIT_NUM`      | CHAR      | 6      |     | Received audit control number          |
| `RELEASED_ON_INV_NUM`  | CHAR      | 7      |     | Released on invoice number             |
| `RELEASED_AUDIT_NUM`   | CHAR      | 6      |     | Released Audit Control number          |
| `ITEM_REV_DATE`        | CHAR      | 6      |     | Form Revision Date                     |
| `TRANS_PHY_INV_IP_LK`  | CHAR      | 11     |     | Transaction/PhyInv in process link     |
| `PHYS_INV_LINK_TO_ICL` | CHAR      | 2      |     | Physical Inventory Link to ICL         |
| `LOT_NUM`              | CHAR      | 8      |     | Lot Number (Release 4.0)               |
| `PROD_CODE_OVERRIDE`   | CHAR      | 3      |     | Product Code Override (4.0)            |
| `COMM_CODE_OVERRIDE`   | CHAR      | 5      |     | Commission Code Override (4.0)         |
| `STORAGE_EXP_DATE`     | DATE      | 6      |     | Storage Expiration Date (4.0)          |
| `STND_COST_UOM`        | CHAR      | 4      |     | Standard Cost Unit of Measure (4.0)    |
| `TRANS_TYPE`           | CHAR      | 1      |     | "Transaction type (R,I,S)"             |
| `TRANS_SRC`            | CHAR      | 2      |     | "Transaction source  (RR,SJ)"          |
| `RECEIPT_DATE`         | DATE      | 6      |     | Receipt date                           |
| `RECVG_REPORT_NUM`     | CHAR      | 8      |     | Receiving report                       |
| `PO_LINE_NUM`          | CHAR      | 3      |     | PO line number                         |
| `LOT_SLSP`             | CHAR      | 4      |     | Primary salesperson of the lot         |
| `ITEM_PRICE_CLASS`     | CHAR      | 3      |     | Item price class of the lot            |
| `TOTAL_COST`           | NUMBER    | 14     | 3   | Total cost                             |
| `TOTAL_FRT`            | NUMBER    | 14     | 3   | Total Freight                          |
| `UNITS_PER_PACK`       | NUMBER    | 14     | 3   | Units Per Pack                         |
| `UNITS_PER_PRIMARY`    | NUMBER    | 14     | 3   | Units Per Primary Packing Unit         |
| `QTY`                  | NUMBER    | 14     | 3   | Quantity                               |
| `SELL_PRICE`           | NUMBER    | 14     | 3   | Sell Price                             |
| `UNITS_PER_UM`         | NUMBER    | 14     | 3   | Units Per UM                           |
| `STND_UNIT_COST`       | NUMBER    | 14     | 3   | Standard Unit Cost                     |
| `STND_UNIT_COST_QTY`   | NUMBER    | 14     | 3   | Standard Unit Cost Qty per UM          |
| `FMS_PRICE`            | NUMBER    | 14     | 3   | IMS Price                              |
| `CUST_PO_TP`           | NUMBER    | 14     | 3   | Customer Supplied PO Type 1=Yes        |
| `TF_STORAGE`           | NUMBER    | 14     | 3   | Total Storage cost                     |
| `FINANCE`              | NUMBER    | 14     | 3   | Total finance cost                     |

**Keys:**
- Primary Key: `INV_LOT_FY`, `INV_LOT_ACCTPD`, `CUST_DIV`, `CUST_CODE`, `ITEM_CODE`, `LOC_CODE`, `SEQ_NUM`
- Alternate Key 1: `INV_LOT_PO_NUM`, `CUST_DIV`, `CUST_CODE`, `ITEM_CODE`, `LOC_CODE`, `SEQ_NUM`, `INV_LOT_FY`, `INV_LOT_ACCTPD`

### Table: `IL0_ImageParms` - Image Parameters

This table stores parameters related to image handling and storage.

| Field Name          | Data Type | Length | Dec | Notes                  |
| :------------------ | :-------- | :----- | :-- | :--------------------- |
| `IMAGE_TYPE`        | CHAR      | 2      |     | Image Type             |
| `CURRENT_DIRECTORY` | CHAR      | 128    |     | Current Directory Path |
| `IMAGE_FORMAT`      | CHAR      | 4      |     | Image File Format      |
| `SCANNER_OPTIONS`   | CHAR      | 60     |     | Scanner Configuration  |
| `ONLY_SAVE_LATEST`  | CHAR      | 1      |     | Flag to save only latest version |
| `ACCESS_LEVEL`      | CHAR      | 3      |     | Access Level           |
| `ADD_FORMAT`        | CHAR      | 1      |     | Additional Format Info |
| `VERSION_LABEL_1`   | CHAR      | 20     |     | Version Label 1        |
| `VERSION_LABEL_2`   | CHAR      | 20     |     | Version Label 2        |
| `VERSION_LABEL_3`   | CHAR      | 20     |     | Version Label 3        |
| `IL0_UNUSED`        | CHAR      | 251    |     | Unused Space           |

**Keys:**
- Primary Key: `IMAGE_TYPE`

### Table: OF3_OEGShip

| Field Name         | Data Type | Start | Length | Description              |
| :----------------- | :-------- | :---- | :----- | :----------------------- |
| GOE_NUMBER         | CHAR      | 1     | 8      | FOG Number               |
| PO_CODE            | CHAR      | 9     | 1      | P/O Code                 |
| GOE_LINE_NUMBER    | CHAR      | 10    | 3      | FOG Line Number          |
| GOE_SEQ_NUMBER     | CHAR      | 13    | 1      | FOG Sequence Number      |
| LOCATION_TYPE      | CHAR      | 14    | 1      | Location Type            |
| SHIP_TO_CODE       | CHAR      | 15    | 4      | Ship to Code             |
| LOCATION_CODE      | CHAR      | 19    | 9      | Location Code            |
| REC_DEPT           | CHAR      | 28    | 20     | Receiving Department     |
| ATTN_LINE          | CHAR      | 48    | 30     | Attention Line           |
| SHIP_ADDR1         | CHAR      | 78    | 30     | Ship Address Line 1      |
| SHIP_ADDR2         | CHAR      | 108   | 30     | Ship Address Line 2      |
| SHIP_CITY          | CHAR      | 138   | 16     | Ship City                |
| SHIP_STATE         | CHAR      | 154   | 2      | Ship State               |
| SHIP_ZIP_CODE      | CHAR      | 156   | 10     | Ship Zip Code            |
| SHIP_FOB           | CHAR      | 166   | 1      | Ship FOB                 |
| HOW_TO_SHIP        | CHAR      | 167   | 1      | How to Ship              |
| SHIP_VIA           | CHAR      | 168   | 1      | Ship Via                 |
| INSIDE_DELIVERY    | CHAR      | 169   | 15     | Inside Delivery          |
| SHIP_WITH          | CHAR      | 184   | 15     | Ship With                |
| MARK_FOR           | CHAR      | 199   | 35     | Mark For                 |
| COMPANY_NAME       | CHAR      | 234   | 35     | Company Name             |
| SHIP_TO_WHSE       | CHAR      | 269   | 4      | Ship to Warehouse        |
| SHIPPING_UNIT      | CHAR      | 273   | 4      | Shipping Unit            |
| FOG_ERROR_CODE     | CHAR      | 277   | 1      | FOG error code           |
| EMAIL_ADDRESS      | CHAR      | 278   | 40     |                          |
| SHIP_VIA_DESC      | CHAR      | 318   | 15     |                          |
| ACCT_NUM           | CHAR      | 333   | 15     | Account number           |
| BILL_M            | CHAR      | 348   | 1      | Method payment           |
| SHIPPER_ID        | CHAR      | 349   | 20     | Shipper ID               |
| STAX_CODE         | CHAR      | 369   | 10     | Sales tax code           |
| SHIP_COUNTRY      | CHAR      | 379   | 2      |                          |
| OF3_UNUSED_1      | CHAR      | 381   | 120    | UNUSED                   |
| SHIP_QTY_PER_UNIT | NUMBER    |       | 14.3   | Shipping Quantity/Unit   |
| SHIP_QTY          | NUMBER    |       | 14.3   | Qty to Ship            |
| OF3_UNUSED_2      | NUMBER    |       | 14.3   | OF3 Unused 2           |
| OF3_UNUSED_3      | NUMBER    |       | 14.3   | OF3 Unused 3           |
| OF3_UNUSED_4      | NUMBER    |       | 14.3   | OF3 Unused 4           |
| OF3_UNUSED_5      | NUMBER    |       | 14.3   | OF3 Unused 5           |
| **Keys:**         |           |       |        |                        |
| *Primary Key*     | GOE_NUMBER, PO_CODE, GOE_LINE_NUMBER, GOE_SEQ_NUMBER |       |        |                        |

### OF4_OEGPOHdr

| Field Name           | Data Type | Start | Length | Description               |
| :------------------- | :-------- | :---- | :----- | :------------------------ |
| GOE_NUMBER           | CHAR      | 1     | 8      | FOG Number                |
| PO_CODE              | CHAR      | 9     | 1      | P/O Code                  |
| PLANT_NAME           | CHAR      | 10    | 35     | Plant Name                |
| PLANT_ATTN           | CHAR      | 45    | 30     | Plant Attention           |
| PLANT_ADDR1          | CHAR      | 75    | 30     | Plant Address #1          |
| PLANT_ADDR2          | CHAR      | 105   | 30     | Plant Address #2          |
| PLANT_CITY           | CHAR      | 135   | 16     | Plant City                |
| PLANT_STATE          | CHAR      | 151   | 2      | Plant State               |
| PLANT_ZIP_CODE       | CHAR      | 153   | 10     | Plant Zip Code            |
| PRINT_PO             | CHAR      | 163   | 1      | Print this P/O            |
| NEW_REPEAT           | CHAR      | 164   | 1      | New/Repeat                |
| CONFIRMING           | CHAR      | 165   | 1      | Confirming                |
| GROUPING_CUTOFF_DATE | CHAR      | 166   | 6      | Grouping Cutoff Date      |
| PLANT_QUOTE_NUM      | CHAR      | 172   | 12     | Plant Quote Number        |
| PLANT_QUOTE_DATE     | DATE      | 184   | 6      | Plant Quote Date          |
| PREV_JOB_NUM         | CHAR      | 190   | 12     | Previous Job Number       |
| PREV_JOB_DATE        | DATE      | 202   | 6      | Previous Job Date         |
| THIS_JOB_NUMBER      | CHAR      | 208   | 12     | This Job Number           |
| THIS_JOB_DATE        | DATE      | 220   | 6      | This Job Date             |
| JOB_STATUS           | CHAR      | 226   | 12     | Job Status                |
| JOB_STATUS_DATE      | DATE      | 238   | 6      | Job Status Date           |
| PROOF_STATUS         | CHAR      | 244   | 1      | Proof Status              |
| PROOF_STATUS_DATE    | DATE      | 245   | 6      | Proof Status Date         |
| SCHD_SHIP_DATE       | DATE      | 251   | 6      | Schedule Shipping Date    |
| CUST_SERV_REP        | CHAR      | 257   | 4      | Customer Service Rep Code |
| OF4_UNUSED_1         | CHAR      | 261   | 50     | Unused                    |
| OF4_UNUSED_2         | NUMBER    |       | 14.3   | OF4 Unused 2              |
| OF4_UNUSED_3         | NUMBER    |       | 14.3   | OF4 Unused 3              |
| OF4_UNUSED_4         | NUMBER    |       | 14.3   | OF4 Unused 4              |
| OF4_UNUSED_5         | NUMBER    |       | 14.3   | OF4 Unused 5              |
| OF4_UNUSED_6         | NUMBER    |       | 14.3   | OF4 Unused 6              |
| **Keys:**            |           |       |        |                           |
| *Primary Key*        | GOE_NUMBER, PO_CODE |       |        |                           |

### OF5_OEGPOCmnt

| Field Name      | Data Type | Start | Length | Description                        |
| :-------------- | :-------- | :---- | :----- | :--------------------------------- |
| GOE_NUMBER      | CHAR      | 1     | 8      | FOG Number                         |
| PO_CODE         | CHAR      | 9     | 1      | P/O Code                           |
| GOE_LINE_NUMBER | CHAR      | 10    | 3      | FOG Line Number or blanks for header |
| PRINT_COMMENT   | CHAR      | 13    | 1      | Print Comment on P/O               |
| PO_COMMENT      | CHAR      | 14    | 64     | Comment                            |
| OF5_UNUSED_1    | CHAR      | 78    | 18     | Unused                             |
| **Keys:**       |           |       |        |                                    |
| *Primary Key*   | GOE_NUMBER, PO_CODE, GOE_LINE_NUMBER |       |        |                                    |

### OF6_OEGOrderNote

| Field Name      | Data Type | Start | Length | Description    |
| :-------------- | :-------- | :---- | :----- | :------------- |
| GOE_NUMBER      | CHAR      | 1     | 8      | FOG Number     |
| NOTEPAD_LINE_1  | CHAR      | 9     | 50     | Notepad line 1 |
| NOTEPAD_LINE_2  | CHAR      | 59    | 50     | Notepad line 2 |
| NOTEPAD_LINE_3  | CHAR      | 109   | 50     | Notepad line 3 |
| NOTEPAD_LINE_4  | CHAR      | 159   | 50     | Notepad line 4 |
| NOTEPAD_LINE_5  | CHAR      | 209   | 50     | Notepad line 5 |
| NOTEPAD_LINE_6  | CHAR      | 259   | 50     | Notepad line 6 |
| NOTEPAD_LINE_7  | CHAR      | 309   | 50     | Notepad line 7 |
| NOTEPAD_LINE_8  | CHAR      | 359   | 50     | Notepad line 8 |
| NOTEPAD_LINE_9  | CHAR      | 409   | 50     | Notepad line 9 |
| NOTEPAD_LINE_10 | CHAR      | 459   | 50     | Notepad line 10|
| **Keys:**       |           |       |        |                |
| *Primary Key*   | GOE_NUMBER |       |        |                |

### OF7_OEGCustParms

| Field Name            | Data Type | Start | Length | Description                       |
| :-------------------- | :-------- | :---- | :----- | :-------------------------------- |
| CUST_DIV              | CHAR      | 1     | 2      | Customer code                     |
| CUST_CODE             | CHAR      | 3     | 8      |                                   |
| ALT_INV_CUST_DIV      | CHAR      | 11    | 2      |                                   |
| ALT_INV_CUST_CODE     | CHAR      | 13    | 8      | Alternate inventory customer code |
| DFLT_ATTN_LINE        | CHAR      | 21    | 30     | Default attention line            |
| SECURE_ITEMS_PERMIT   | CHAR      | 51    | 20     | Secure forms permitted            |
| PRCNT_OF_MTHLY_AVG    | CHAR      | 71    | 3      | % of monthly average as limit     |
| REQS_REV_BEF_SHIPMNT  | CHAR      | 74    | 1      | Reqs reviewed before shipment?    |
| CAN_STOCK_ITEM_REQU   | CHAR      | 75    | 1      | Can stock items be requisitioned? |
| NO_BACKORDERS         | CHAR      | 76    | 1      |                                   |
| TRY_OPP_WHSE          | CHAR      | 77    | 1      |                                   |
| OF7_UNUSED_01         | CHAR      | 78    | 43     |                                   |
| **Keys:**             |           |       |        |                                   |
| *Primary Key*         | CUST_DIV, CUST_CODE |       |        |                                   |

### Table: `OFC_WebECOEShip` - Web ECOEShip

| Field Name        | Data Type | Start | Length | Description            |
| :---------------- | :-------- | :---- | :----- | :--------------------- |
| FOG_NUMBER        | CHAR      | 1     | 8      | FOG Number             |
| PO_CODE           | CHAR      | 9     | 1      | P/O Code               |
| FOG_LINE_NUMBER   | CHAR      | 10    | 3      | FOG Line Number        |
| FOG_SEQ_NUMBER    | CHAR      | 13    | 1      | FOG Sequence Number    |
| LOCATION_TYPE     | CHAR      | 14    | 1      | Location Type          |
| SHIP_TO_CODE      | CHAR      | 15    | 4      | Ship to Code           |
| LOCATION_CODE     | CHAR      | 19    | 9      | Location Code          |
| REC_DEPT          | CHAR      | 28    | 20     | Receiving Department   |
| ATTN_LINE         | CHAR      | 48    | 30     | Attention Line         |
| SHIP_ADDR1        | CHAR      | 78    | 30     | Ship Address Line 1    |
| SHIP_ADDR2        | CHAR      | 108   | 30     | Ship Address Line 2    |
| SHIP_CITY         | CHAR      | 138   | 16     | Ship City              |
| SHIP_STATE        | CHAR      | 154   | 2      | Ship State             |
| SHIP_ZIP_CODE     | CHAR      | 156   | 10     | Ship Zip Code          |
| SHIP_FOB          | CHAR      | 166   | 1      | Ship FOB               |
| HOW_TO_SHIP       | CHAR      | 167   | 1      | How to Ship            |
| SHIP_VIA          | CHAR      | 168   | 1      | Ship Via               |
| INSIDE_DELIVERY   | CHAR      | 169   | 15     | Inside Delivery        |
| SHIP_WITH         | CHAR      | 184   | 15     | Ship With              |
| MARK_FOR          | CHAR      | 199   | 35     | Mark For               |
| COMPANY_NAME      | CHAR      | 234   | 35     | Company Name           |
| SHIP_TO_WHSE      | CHAR      | 269   | 4      | Ship to Warehouse      |
| SHIPPING_UNIT     | CHAR      | 273   | 4      | Shipping Unit          |
| FOG_ERROR_CODE    | CHAR      | 277   | 1      | FOG error code         |
| EMAIL_ADDRESS     | CHAR      | 278   | 40     |                        |
| SHIP_VIA_DESC     | CHAR      | 318   | 15     |                        |
| ACCT_NUM          | CHAR      | 333   | 15     | Account number         |
| BILL_M            | CHAR      | 348   | 1      | Method payment         |
| SHIPPER_ID        | CHAR      | 349   | 20     | Shipper ID             |
| STAX_CODE         | CHAR      | 369   | 10     | Sales tax code         |
| SHIP_COUNTRY      | CHAR      | 379   | 2      |                        |
| OFC_UNUSED_1      | CHAR      | 381   | 120    | UNUSED                 |
| SHIP_QTY_PER_UNIT | NUMBER    |       | 14.3   | Shipping Quantity/Unit |
| SHIP_QTY          | NUMBER    |       | 14.3   | Qty to Ship            |
| OFC_UNUSED_2      | NUMBER    |       | 14.3   | OFC Unused 2           |
| OFC_UNUSED_3      | NUMBER    |       | 14.3   | OFC Unused 3           |
| OFC_UNUSED_4      | NUMBER    |       | 14.3   | OFC Unused 4           |
| OFC_UNUSED_5      | NUMBER    |       | 14.3   | OFC Unused 5           |
| **Keys:**         |           |       |        |                        |
| *Primary Key*     | FOG_NUMBER, PO_CODE, FOG_LINE_NUMBER, FOG_SEQ_NUMBER |       |        |                        |

### OFG_AddlOrdLnsItem Table Definition

| Field Name        | Data Type | Start | Length | Description   |
| :---------------- | :-------- | :---- | :----- | :------------ |
| CUST_DIV          | CHAR      | 1     | 2      | Customer code |
| CUST_CODE         | CHAR      | 3     | 8      |               |
| ITEM_CODE         | CHAR      | 11    | 10     |               |
| SEQ_NUM           | CHAR      | 21    | 3      |               |
| FOG_NUM           | CHAR      | 24    | 8      |               |
| FOG_LN_NUM        | CHAR      | 32    | 3      |               |
| LINE_TYPE         | CHAR      | 35    | 1      |               |
| CUST_ITEM_LN_TYPE | CHAR      | 36    | 1      |               |
| PO_CODE           | CHAR      | 37    | 1      |               |
| CUST_DIV_2        | CHAR      | 38    | 2      |               |
| CUST_CODE_2       | CHAR      | 40    | 8      |               |
| ITEM_CODE_2       | CHAR      | 48    | 20     |               |
| TF_DESCRIPTION    | CHAR      | 68    | 40     |               |
| VEND_DIV          | CHAR      | 108   | 2      |               |
| VEND_CODE         | CHAR      | 110   | 8      |               |
| PLANT_CODE        | CHAR      | 118   | 4      |               |
| STARTING_NUM      | CHAR      | 122   | 9      |               |
| ENDING_NUM        | CHAR      | 131   | 9      |               |
| SELLING_UNIT      | CHAR      | 140   | 4      |               |
| VEND_JOB_NUM      | CHAR      | 144   | 12     |               |
| VEND_JOB_DATE     | CHAR      | 156   | 6      |               |
| SHIP_FROM_WHSE    | CHAR      | 162   | 4      |               |
| SPECIAL_SHIP      | CHAR      | 166   | 1      |               |
| FOG_ERROR         | CHAR      | 167   | 1      |               |
| OFG_UNUSED_1      | CHAR      | 168   | 54     |               |
| SELL_QTY_PER_U    | NUMBER    |       | 5.2    |               |
| PRICE_PER_UNIT    | NUMBER    |       | 6.2    |               |
| COST_PER_UNIT     | NUMBER    |       | 6.2    |               |
| QTY_ORDERED       | NUMBER    |       | 8.2    |               |
| CARTON_PACK       | NUMBER    |       | 5.2    |               |
| OFG_UNUSED_2      | NUMBER    |       | 10.2   |               |
| OFG_UNUSED_3      | NUMBER    |       | 10.2   |               |
| OFG_UNUSED_4      | NUMBER    |       | 10.2   |               |
| **Keys:**         |           |       |        |               |
| *Primary Key*     | CUST_DIV, CUST_CODE, ITEM_CODE, SEQ_NUM |       |        |               |

### OFH_VendMap Table Definition

| Field Name     | Data Type | Start | Length | Description |
| :------------- | :-------- | :---- | :----- | :---------- |
| IN_VENDOR_CODE | CHAR      | 1     | 10     |             |
| VENDOR         | CHAR      | 11    | 10     |             |
| **Keys:**      |           |       |        |             |
| *Primary Key*  | IN_VENDOR_CODE |       |        |             |

### OR1_PickPri Table Definition

| Field Name      | Data Type | Start | Length | Description |
| :-------------- | :-------- | :---- | :----- | :---------- |
| PICK_PRIORITY   | CHAR      | 1     | 2      |             |
| PICK_PRI_DESC   | CHAR      | 3     | 30     |             |
| PICK_PRI_UNUSED | CHAR      | 33    | 95     |             |
| **Keys:**       |           |       |        |             |
| *Primary Key*   | PICK_PRIORITY |       |        |             |

### OS0_Off_Supp Table Definition

| Field Name        | Data Type | Start | Length | Description             |
| :---------------- | :-------- | :---- | :----- | :---------------------- |
| ITEM_NUM_KEY      | CHAR      | 1     | 10     |                         |
| SOURCE            | CHAR      | 11    | 3      |                         |
| VERSION           | CHAR      | 14    | 3      |                         |
| CUST_DIV          | CHAR      | 17    | 2      |                         |
| CUST_CODE         | CHAR      | 19    | 8      |                         |
| ITEM_CODE         | CHAR      | 27    | 10     |                         |
| TF_DESC           | CHAR      | 37    | 40     |                         |
| PROD_CODE         | CHAR      | 77    | 3      |                         |
| LEFT_RIGHT        | CHAR      | 80    | 8      |                         |
| TOP_BOTTOM        | CHAR      | 88    | 8      |                         |
| PLYS              | CHAR      | 96    | 2      |                         |
| SUPPLY_DIV        | CHAR      | 98    | 2      |                         |
| SUPPLY_CODE       | CHAR      | 100   | 8      |                         |
| PLANT_CODE        | CHAR      | 108   | 4      |                         |
| LAST_SOLD         | DATE      | 112   | 6      |                         |
| LAST_PURCH        | DATE      | 118   | 6      |                         |
| STAT_FLAG         | CHAR      | 124   | 1      | "Status Flag, I=Inactive" |
| ITEM_PRICE_CLASS  | CHAR      | 125   | 3      |                         |
| LOT_INVT          | CHAR      | 128   | 1      |                         |
| QTY_BRK_P_G       | CHAR      | 129   | 3      |                         |
| REQ_SECURE        | CHAR      | 132   | 1      |                         |
| TF_UNUSED         | CHAR      | 133   | 3      |                         |
| SELL_UNIT         | CHAR      | 136   | 4      |                         |
| INVT_UM           | CHAR      | 140   | 4      |                         |
| DESC_01           | CHAR      | 144   | 40     |                         |
| FORM_GROUP        | CHAR      | 184   | 10     |                         |
| PRICE_FEATURES    | CHAR      | 194   | 10     |                         |
| BASE_PRICE        | CHAR      | 204   | 10     |                         |
| QTY_BRK_1         | CHAR      | 214   | 10     |                         |
| QTY_PRC_1         | CHAR      | 224   | 10     |                         |
| QTY_BRK_2         | CHAR      | 234   | 10     |                         |
| QTY_PRC_2         | CHAR      | 244   | 10     |                         |
| QTY_BRK_3         | CHAR      | 254   | 10     |                         |
| QTY_PRC_3         | CHAR      | 264   | 10     |                         |
| QTY_BRK_4         | CHAR      | 274   | 10     |                         |
| QTY_PRC_4         | CHAR      | 284   | 10     |                         |
| QTY_BRK_5         | CHAR      | 294   | 10     |                         |
| QTY_PRC_5         | CHAR      | 304   | 10     |                         |
| QTY_BRK_6         | CHAR      | 314   | 10     |                         |
| QTY_PRC_6         | CHAR      | 324   | 10     |                         |
| AVG_SALES_PRICE   | CHAR      | 334   | 10     |                         |
| SELL_Q_U          | CHAR      | 344   | 10     |                         |
| INVT_Q_U          | CHAR      | 354   | 10     |                         |
| CTN_WT            | CHAR      | 364   | 10     |                         |
| LAST_PURCH_COST   | CHAR      | 374   | 10     |                         |
| AVG_COST          | CHAR      | 384   | 10     |                         |
| CTN_PACK          | CHAR      | 394   | 10     |                         |
| SPER_UNIT_COST    | CHAR      | 404   | 10     |                         |
| QTY_BRK_7         | CHAR      | 414   | 10     |                         |
| QTY_PRC_7         | CHAR      | 424   | 10     |                         |
| QTY_BRK_8         | CHAR      | 434   | 10     |                         |
| QTY_PRC_8         | CHAR      | 444   | 10     |                         |
| QTY_BRK_9         | CHAR      | 454   | 10     |                         |
| QTY_PRC_9         | CHAR      | 464   | 10     |                         |
| QTY_BRK_10        | CHAR      | 474   | 10     |                         |
| QTY_PRC_10        | CHAR      | 484   | 10     |                         |
| QTY_BRK_11        | CHAR      | 494   | 10     |                         |
| QTY_PRC_11        | CHAR      | 504   | 10     |                         |
| QTY_BRK_12        | CHAR      | 514   | 10     |                         |
| QTY_PRC_12        | CHAR      | 524   | 10     |                         |
| VENDOR_DIV        | CHAR      | 534   | 2      |                         |
| VENDOR_CODE       | CHAR      | 536   | 8      |                         |
| PLANT_CODE_2      | CHAR      | 544   | 4      |                         |
| SUPP_ITEM_NUM     | CHAR      | 548   | 20     |                         |
| PURCH_UM          | CHAR      | 568   | 4      |                         |
| DATE_LAST_PURCH   | DATE      | 572   | 6      |                         |
| BASE_COST         | CHAR      | 578   | 10     |                         |
| BRK_QTY_1         | CHAR      | 588   | 10     |                         |
| QTY_COST_1        | CHAR      | 598   | 10     |                         |
| BRK_QTY_2         | CHAR      | 608   | 10     |                         |
| QTY_COST_2        | CHAR      | 618   | 10     |                         |
| BRK_QTY_3         | CHAR      | 628   | 10     |                         |
| QTY_COST_3        | CHAR      | 638   | 10     |                         |
| BRK_QTY_4         | CHAR      | 648   | 10     |                         |
| QTY_COST_4        | CHAR      | 658   | 10     |                         |
| BRK_QTY_5         | CHAR      | 668   | 10     |                         |
| QTY_COST_5        | CHAR      | 678   | 10     |                         |
| BRK_QTY_6         | CHAR      | 688   | 10     |                         |
| QTY_COST_6        | CHAR      | 698   | 10     |                         |
| LAST_COST         | CHAR      | 708   | 10     |                         |
| QTY_PER_UM        | CHAR      | 718   | 10     |                         |
| CTN_WT_2          | CHAR      | 728   | 10     |                         |
| CTN_PACK_2        | CHAR      | 738   | 10     |                         |
| UNUSED_2          | CHAR      | 748   | 52     |                         |
| **Keys:**         |           |       |        |                         |
| *Primary Key*     | ITEM_NUM_KEY |       |        |                         |
| *Alternate Key 1* | SUPP_ITEM_NUM |       |        |                         |

### OS1_Price_Plan Table Definition

| Field Name      | Data Type | Start | Length | Description |
| :-------------- | :-------- | :---- | :----- | :---------- |
| ITEM_CODE       | CHAR      | 1     | 10     |             |
| PRICE_PLAN_CODE | CHAR      | 11    | 6      |             |
| HOW_PRICED      | CHAR      | 17    | 1      |             |
| FLYER_PRICE     | CHAR      | 18    | 1      |             |
| OS1_UNUSED_1    | CHAR      | 19    | 6      |             |
| START_DATE      | DATE      | 25    | 6      |             |
| END_DATE        | DATE      | 31    | 6      |             |
| BENCHMARK       | CHAR      | 37    | 10     |             |
| CALC_PRICE      | CHAR      | 47    | 10     |             |
| TF_COST         | CHAR      | 57    | 10     |             |
| OS1_UNUSED_3    | CHAR      | 67    | 170    |             |
| BASE_PRICE      | CHAR      | 237   | 10     |             |
| OS1_UNUSED_4    | CHAR      | 247   | 2      |             |
| OS1_UNUSED_5    | CHAR      | 249   | 1      |             |
| **Keys:**       |           |       |        |             |
| *Primary Key*   | ITEM_CODE, PRICE_PLAN_CODE |       |        |             |

### OS2_ItemPrimInfo Table Definition

| Field Name       | Data Type | Start | Length | Description |
| :--------------- | :-------- | :---- | :----- | :---------- |
| ITEM_NUMBER      | CHAR      | 1     | 10     |             |
| TF_PREFIX        | CHAR      | 11    | 3      |             |
| STOCK_NUM_BUTT   | CHAR      | 14    | 12     |             |
| LIST_PRICE       | CHAR      | 26    | 10     |             |
| RETAIL_UM        | CHAR      | 36    | 4      |             |
| STOCK_NUM_UNBUTT | CHAR      | 40    | 12     |             |
| DATE_LAST_TAPE   | DATE      | 52    | 6      |             |
| LOAD_SOURCE      | CHAR      | 58    | 1      |             |
| UNITED_UM        | CHAR      | 59    | 2      |             |
| IMAGE_NAME       | CHAR      | 61    | 15     |             |
| ADDL_NAME        | CHAR      | 76    | 15     |             |
| OS2_UNUSED_2     | CHAR      | 91    | 38     |             |
| **Keys:**        |           |       |        |             |
| *Primary Key*    | ITEM_NUMBER |       |        |             |

### OS3_FileLayPrint Table Definition

| Field Name   | Data Type | Start | Length | Description |
| :----------- | :-------- | :---- | :----- | :---------- |
| ERROR_CODE   | CHAR      | 1     | 6      |             |
| DESC_1       | CHAR      | 7     | 60     |             |
| DESC_2       | CHAR      | 67    | 60     |             |
| ERROR_TYPE   | CHAR      | 127   | 1      |             |
| OS3_UNUSED_1 | CHAR      | 128   | 3      |             |
| **Keys:**    |           |       |        |             |
| *Primary Key*| ERROR_CODE|       |        |             |

### OS4_TransErrRep Table Definition

| Field Name              | Data Type | Start | Length | Description             |
| :---------------------- | :-------- | :---- | :----- | :---------------------- |
| ORDER_DIV               | CHAR      | 1     | 2      |                         |
| ORDER_NUM               | CHAR      | 3     | 7      |                         |
| LINE_NUMBER             | CHAR      | 10    | 3      |                         |
| TRANSMISSION_REC_TYPE   | CHAR      | 13    | 1      |                         |
| BLANK                   | CHAR      | 14    | 5      |                         |
| DATA_STRING_FROM_UNITED | CHAR      | 19    | 494    |                         |
| **Keys:**               |           |       |        |                         |
| *Primary Key*           | ORDER_DIV, ORDER_NUM, LINE_NUMBER, TRANSMISSION_REC_TYPE, BLANK |       |        |                         |

### OS6_PricePlanPriorities Table Definition

| Field Name         | Data Type | Start | Length | Description      |
| :----------------- | :-------- | :---- | :----- | :--------------- |
| CUST_DIV           | CHAR      | 1     | 2      |                  |
| CUST_CODE          | CHAR      | 3     | 8      |                  |
| PRICE_TYPE         | CHAR      | 11    | 1      |                  |
| ALLOW_ZERO_PRICE   | CHAR      | 12    | 1      |                  |
| OS6_UNUSED_1       | CHAR      | 13    | 9      |                  |
| PRIORITY_1         | CHAR      | 22    | 6      |                  |
| PRIORITY_2         | CHAR      | 28    | 6      |                  |
| PRIORITY_3         | CHAR      | 34    | 6      |                  |
| PRIORITY_4         | CHAR      | 40    | 6      |                  |
| PRIORITY_5         | CHAR      | 46    | 6      |                  |
| PRIORITY_6         | CHAR      | 52    | 6      |                  |
| PRIORITY_7         | CHAR      | 58    | 6      |                  |
| PRIORITY_8         | CHAR      | 64    | 6      |                  |
| PRIORITY_9         | CHAR      | 70    | 6      |                  |
| PRIORITY_10        | CHAR      | 76    | 6      |                  |
| PRIORITY_11        | CHAR      | 82    | 6      |                  |
| PRIORITY_12        | CHAR      | 88    | 6      |                  |
| PRIORITY_13        | CHAR      | 94    | 6      |                  |
| PRIORITY_14        | CHAR      | 100   | 6      |                  |
| PRIORITY_15        | CHAR      | 106   | 6      |                  |
| PRIORITY_16        | CHAR      | 112   | 6      |                  |
| PRIORITY_17        | CHAR      | 118   | 6      |                  |
| PRIORITY_18        | CHAR      | 124   | 6      |                  |
| PRIORITY_19        | CHAR      | 130   | 6      |                  |
| PRIORITY_20        | CHAR      | 136   | 6      |                  |
| PRIORITY_21        | CHAR      | 142   | 6      |                  |
| PRIORITY_22        | CHAR      | 148   | 6      |                  |
| PRIORITY_23        | CHAR      | 154   | 6      |                  |
| PRIORITY_24        | CHAR      | 160   | 6      |                  |
| PRIORITY_25        | CHAR      | 166   | 6      |                  |
| OS6_UNUSED_2       | CHAR      | 172   | 12     |                  |
| **Keys:**          |           |       |        |                  |
| *Primary Key*      | CUST_DIV, CUST_CODE |       |        |                  |

### Table: `OS7_ItemCostPricePlan` - Item Cost Price Plan

| Field Name   | Data Type | Start | Length | Description |
| :----------- | :-------- | :---- | :----- | :---------- |
| ITEM_NUMBER  | CHAR      | 1     | 10     |             |
| PRICE_PLAN   | CHAR      | 11    | 6      |             |
| NET_QUANT_1  | CHAR      | 17    | 10     |             |
| NET_PRICE_1  | CHAR      | 27    | 10     |             |
| NET_QUANT_2  | CHAR      | 37    | 10     |             |
| NET_PRICE_2  | CHAR      | 47    | 10     |             |
| NET_QUANT_3  | CHAR      | 57    | 10     |             |
| NET_PRICE_3  | CHAR      | 67    | 10     |             |
| START_DATE   | DATE      | 77    | 6      |             |
| END_DATE     | DATE      | 83    | 6      |             |
| NET_PRICE_4  | CHAR      | 89    | 10     |             |
| NET_QUANT_4  | CHAR      | 99    | 10     |             |
| OS7_UNUSED_1 | CHAR      | 109   | 19     |             |
| **Keys:**    |           |       |        |             |
| *Primary Key*| ITEM_NUMBER, PRICE_PLAN |       |        |             |

### Table: `OS8_TransSendRep` - Transaction Send Report

| Field Name              | Data Type | Start | Length | Description                   |
| :---------------------- | :-------- | :---- | :----- | :---------------------------- |
| ORDER_DIV               | CHAR      | 1     | 2      | Order Division sent to United |
| ORDER_NUM               | CHAR      | 3     | 7      |                               |
| LINE_NUMBER             | CHAR      | 10    | 3      |                               |
| TRANSMISSION_REC_TYPE   | CHAR      | 13    | 1      |                               |
| BLANK                   | CHAR      | 14    | 5      |                               |
| DATA_STRING_FROM_UNITED | CHAR      | 19    | 494    |                               |
| **Keys:**               |           |       |        |                               |
| *Primary Key*           | ORDER_DIV, ORDER_NUM, LINE_NUMBER, TRANSMISSION_REC_TYPE, BLANK |       |        |                               |

### OFG_AddlOrdLnsItem Table Definition

| Field Name        | Data Type | Start | Length | Description   |
| :---------------- | :-------- | :---- | :----- | :------------ |
| CUST_DIV          | CHAR      | 1     | 2      | Customer code |
| CUST_CODE         | CHAR      | 3     | 8      |               |
| ITEM_CODE         | CHAR      | 11    | 10     |               |
| SEQ_NUM           | CHAR      | 21    | 3      |               |
| FOG_NUM           | CHAR      | 24    | 8      |               |
| FOG_LN_NUM        | CHAR      | 32    | 3      |               |
| LINE_TYPE         | CHAR      | 35    | 1      |               |
| CUST_ITEM_LN_TYPE | CHAR      | 36    | 1      |               |
| PO_CODE           | CHAR      | 37    | 1      |               |
| CUST_DIV_2        | CHAR      | 38    | 2      |               |
| CUST_CODE_2       | CHAR      | 40    | 8      |               |
| ITEM_CODE_2       | CHAR      | 48    | 20     |               |
| TF_DESCRIPTION    | CHAR      | 68    | 40     |               |
| VEND_DIV          | CHAR      | 108   | 2      |               |
| VEND_CODE         | CHAR      | 110   | 8      |               |
| PLANT_CODE        | CHAR      | 118   | 4      |               |
| STARTING_NUM      | CHAR      | 122   | 9      |               |
| ENDING_NUM        | CHAR      | 131   | 9      |               |
| SELLING_UNIT      | CHAR      | 140   | 4      |               |
| VEND_JOB_NUM      | CHAR      | 144   | 12     |               |
| VEND_JOB_DATE     | CHAR      | 156   | 6      |               |
| SHIP_FROM_WHSE    | CHAR      | 162   | 4      |               |
| SPECIAL_SHIP      | CHAR      | 166   | 1      |               |
| FOG_ERROR         | CHAR      | 167   | 1      |               |
| OFG_UNUSED_1      | CHAR      | 168   | 54     |               |
| SELL_QTY_PER_U    | NUMBER    |       | 5.2    |               |
| PRICE_PER_UNIT    | NUMBER    |       | 6.2    |               |
| COST_PER_UNIT     | NUMBER    |       | 6.2    |               |
| QTY_ORDERED       | NUMBER    |       | 8.2    |               |
| CARTON_PACK       | NUMBER    |       | 5.2    |               |
| OFG_UNUSED_2      | NUMBER    |       | 10.2   |               |
| OFG_UNUSED_3      | NUMBER    |       | 10.2   |               |
| OFG_UNUSED_4      | NUMBER    |       | 10.2   |               |
| **Keys:**         |           |       |        |               |
| *Primary Key*     | CUST_DIV, CUST_CODE, ITEM_CODE, SEQ_NUM |       |        |               |

### OFH_VendMap Table Definition

| Field Name     | Data Type | Start | Length | Description |
| :------------- | :-------- | :---- | :----- | :---------- |
| IN_VENDOR_CODE | CHAR      | 1     | 10     |             |
| VENDOR         | CHAR      | 11    | 10     |             |
| **Keys:**      |           |       |        |             |
| *Primary Key*  | IN_VENDOR_CODE |       |        |             |

### OR1_PickPri Table Definition

| Field Name      | Data Type | Start | Length | Description |
| :-------------- | :-------- | :---- | :----- | :---------- |
| PICK_PRIORITY   | CHAR      | 1     | 2      |             |
| PICK_PRI_DESC   | CHAR      | 3     | 30     |             |
| PICK_PRI_UNUSED | CHAR      | 33    | 95     |             |
| **Keys:**       |           |       |        |             |
| *Primary Key*   | PICK_PRIORITY |       |        |             |

### OS0_Off_Supp Table Definition

| Field Name        | Data Type | Start | Length | Description             |
| :---------------- | :-------- | :---- | :----- | :---------------------- |
| ITEM_NUM_KEY      | CHAR      | 1     | 10     |                         |
| SOURCE            | CHAR      | 11    | 3      |                         |
| VERSION           | CHAR      | 14    | 3      |                         |
| CUST_DIV          | CHAR      | 17    | 2      |                         |
| CUST_CODE         | CHAR      | 19    | 8      |                         |
| ITEM_CODE         | CHAR      | 27    | 10     |                         |
| TF_DESC           | CHAR      | 37    | 40     |                         |
| PROD_CODE         | CHAR      | 77    | 3      |                         |
| LEFT_RIGHT        | CHAR      | 80    | 8      |                         |
| TOP_BOTTOM        | CHAR      | 88    | 8      |                         |
| PLYS              | CHAR      | 96    | 2      |                         |
| SUPPLY_DIV        | CHAR      | 98    | 2      |                         |
| SUPPLY_CODE       | CHAR      | 100   | 8      |                         |
| PLANT_CODE        | CHAR      | 108   | 4      |                         |
| LAST_SOLD         | DATE      | 112   | 6      |                         |
| LAST_PURCH        | DATE      | 118   | 6      |                         |
| STAT_FLAG         | CHAR      | 124   | 1      | "Status Flag, I=Inactive" |
| ITEM_PRICE_CLASS  | CHAR      | 125   | 3      |                         |
| LOT_INVT          | CHAR      | 128   | 1      |                         |
| QTY_BRK_P_G       | CHAR      | 129   | 3      |                         |
| REQ_SECURE        | CHAR      | 132   | 1      |                         |
| TF_UNUSED         | CHAR      | 133   | 3      |                         |
| SELL_UNIT         | CHAR      | 136   | 4      |                         |
| INVT_UM           | CHAR      | 140   | 4      |                         |
| DESC_01           | CHAR      | 144   | 40     |                         |
| FORM_GROUP        | CHAR      | 184   | 10     |                         |
| PRICE_FEATURES    | CHAR      | 194   | 10     |                         |
| BASE_PRICE        | CHAR      | 204   | 10     |                         |
| QTY_BRK_1         | CHAR      | 214   | 10     |                         |
| QTY_PRC_1         | CHAR      | 224   | 10     |                         |
| QTY_BRK_2         | CHAR      | 234   | 10     |                         |
| QTY_PRC_2         | CHAR      | 244   | 10     |                         |
| QTY_BRK_3         | CHAR      | 254   | 10     |                         |
| QTY_PRC_3         | CHAR      | 264   | 10     |                         |
| QTY_BRK_4         | CHAR      | 274   | 10     |                         |
| QTY_PRC_4         | CHAR      | 284   | 10     |                         |
| QTY_BRK_5         | CHAR      | 294   | 10     |                         |
| QTY_PRC_5         | CHAR      | 304   | 10     |                         |
| QTY_BRK_6         | CHAR      | 314   | 10     |                         |
| QTY_PRC_6         | CHAR      | 324   | 10     |                         |
| AVG_SALES_PRICE   | CHAR      | 334   | 10     |                         |
| SELL_Q_U          | CHAR      | 344   | 10     |                         |
| INVT_Q_U          | CHAR      | 354   | 10     |                         |
| CTN_WT            | CHAR      | 364   | 10     |                         |
| LAST_PURCH_COST   | CHAR      | 374   | 10     |                         |
| AVG_COST          | CHAR      | 384   | 10     |                         |
| CTN_PACK          | CHAR      | 394   | 10     |                         |
| SPER_UNIT_COST    | CHAR      | 404   | 10     |                         |
| QTY_BRK_7         | CHAR      | 414   | 10     |                         |
| QTY_PRC_7         | CHAR      | 424   | 10     |                         |
| QTY_BRK_8         | CHAR      | 434   | 10     |                         |
| QTY_PRC_8         | CHAR      | 444   | 10     |                         |
| QTY_BRK_9         | CHAR      | 454   | 10     |                         |
| QTY_PRC_9         | CHAR      | 464   | 10     |                         |
| QTY_BRK_10        | CHAR      | 474   | 10     |                         |
| QTY_PRC_10        | CHAR      | 484   | 10     |                         |
| QTY_BRK_11        | CHAR      | 494   | 10     |                         |
| QTY_PRC_11        | CHAR      | 504   | 10     |                         |
| QTY_BRK_12        | CHAR      | 514   | 10     |                         |
| QTY_PRC_12        | CHAR      | 524   | 10     |                         |
| VENDOR_DIV        | CHAR      | 534   | 2      |                         |
| VENDOR_CODE       | CHAR      | 536   | 8      |                         |
| PLANT_CODE_2      | CHAR      | 544   | 4      |                         |
| SUPP_ITEM_NUM     | CHAR      | 548   | 20     |                         |
| PURCH_UM          | CHAR      | 568   | 4      |                         |
| DATE_LAST_PURCH   | DATE      | 572   | 6      |                         |
| BASE_COST         | CHAR      | 578   | 10     |                         |
| BRK_QTY_1         | CHAR      | 588   | 10     |                         |
| QTY_COST_1        | CHAR      | 598   | 10     |                         |
| BRK_QTY_2         | CHAR      | 608   | 10     |                         |
| QTY_COST_2        | CHAR      | 618   | 10     |                         |
| BRK_QTY_3         | CHAR      | 628   | 10     |                         |
| QTY_COST_3        | CHAR      | 638   | 10     |                         |
| BRK_QTY_4         | CHAR      | 648   | 10     |                         |
| QTY_COST_4        | CHAR      | 658   | 10     |                         |
| BRK_QTY_5         | CHAR      | 668   | 10     |                         |
| QTY_COST_5        | CHAR      | 678   | 10     |                         |
| BRK_QTY_6         | CHAR      | 688   | 10     |                         |
| QTY_COST_6        | CHAR      | 698   | 10     |                         |
| LAST_COST         | CHAR      | 708   | 10     |                         |
| QTY_PER_UM        | CHAR      | 718   | 10     |                         |
| CTN_WT_2          | CHAR      | 728   | 10     |                         |
| CTN_PACK_2        | CHAR      | 738   | 10     |                         |
| UNUSED_2          | CHAR      | 748   | 52     |                         |
| **Keys:**         |           |       |        |                         |
| *Primary Key*     | ITEM_NUM_KEY |       |        |                         |
| *Alternate Key 1* | SUPP_ITEM_NUM |       |        |                         |

### OS1_Price_Plan Table Definition

| Field Name      | Data Type | Start | Length | Description |
| :-------------- | :-------- | :---- | :----- | :---------- |
| ITEM_CODE       | CHAR      | 1     | 10     |             |
| PRICE_PLAN_CODE | CHAR      | 11    | 6      |             |
| HOW_PRICED      | CHAR      | 17    | 1      |             |
| FLYER_PRICE     | CHAR      | 18    | 1      |             |
| OS1_UNUSED_1    | CHAR      | 19    | 6      |             |
| START_DATE      | DATE      | 25    | 6      |             |
| END_DATE        | DATE      | 31    | 6      |             |
| BENCHMARK       | CHAR      | 37    | 10     |             |
| CALC_PRICE      | CHAR      | 47    | 10     |             |
| TF_COST         | CHAR      | 57    | 10     |             |
| OS1_UNUSED_3    | CHAR      | 67    | 170    |             |
| BASE_PRICE      | CHAR      | 237   | 10     |             |
| OS1_UNUSED_4    | CHAR      | 247   | 2      |             |
| OS1_UNUSED_5    | CHAR      | 249   | 1      |             |
| **Keys:**       |           |       |        |             |
| *Primary Key*   | ITEM_CODE, PRICE_PLAN_CODE |       |        |             |

### OS2_ItemPrimInfo Table Definition

| Field Name       | Data Type | Start | Length | Description |
| :--------------- | :-------- | :---- | :----- | :---------- |
| ITEM_NUMBER      | CHAR      | 1     | 10     |             |
| TF_PREFIX        | CHAR      | 11    | 3      |             |
| STOCK_NUM_BUTT   | CHAR      | 14    | 12     |             |
| LIST_PRICE       | CHAR      | 26    | 10     |             |
| RETAIL_UM        | CHAR      | 36    | 4      |             |
| STOCK_NUM_UNBUTT | CHAR      | 40    | 12     |             |
| DATE_LAST_TAPE   | DATE      | 52    | 6      |             |
| LOAD_SOURCE      | CHAR      | 58    | 1      |             |
| UNITED_UM        | CHAR      | 59    | 2      |             |
| IMAGE_NAME       | CHAR      | 61    | 15     |             |
| ADDL_NAME        | CHAR      | 76    | 15     |             |
| OS2_UNUSED_2     | CHAR      | 91    | 38     |             |
| **Keys:**        |           |       |        |             |
| *Primary Key*    | ITEM_NUMBER |       |        |             |

### OS3_FileLayPrint Table Definition

| Field Name   | Data Type | Start | Length | Description |
| :----------- | :-------- | :---- | :----- | :---------- |
| ERROR_CODE   | CHAR      | 1     | 6      |             |
| DESC_1       | CHAR      | 7     | 60     |             |
| DESC_2       | CHAR      | 67    | 60     |             |
| ERROR_TYPE   | CHAR      | 127   | 1      |             |
| OS3_UNUSED_1 | CHAR      | 128   | 3      |             |
| **Keys:**    |           |       |        |             |
| *Primary Key*| ERROR_CODE|       |        |             |

### OS4_TransErrRep Table Definition

| Field Name              | Data Type | Start | Length | Description             |
| :---------------------- | :-------- | :---- | :----- | :---------------------- |
| ORDER_DIV               | CHAR      | 1     | 2      |                         |
| ORDER_NUM               | CHAR      | 3     | 7      |                         |
| LINE_NUMBER             | CHAR      | 10    | 3      |                         |
| TRANSMISSION_REC_TYPE   | CHAR      | 13    | 1      |                         |
| BLANK                   | CHAR      | 14    | 5      |                         |
| DATA_STRING_FROM_UNITED | CHAR      | 19    | 494    |                         |
| **Keys:**               |           |       |        |                         |
| *Primary Key*           | ORDER_DIV, ORDER_NUM, LINE_NUMBER, TRANSMISSION_REC_TYPE, BLANK |       |        |                         |

### OS6_PricePlanPriorities Table Definition

| Field Name         | Data Type | Start | Length | Description      |
| :----------------- | :-------- | :---- | :----- | :--------------- |
| CUST_DIV           | CHAR      | 1     | 2      |                  |
| CUST_CODE          | CHAR      | 3     | 8      |                  |
| PRICE_TYPE         | CHAR      | 11    | 1      |                  |
| ALLOW_ZERO_PRICE   | CHAR      | 12    | 1      |                  |
| OS6_UNUSED_1       | CHAR      | 13    | 9      |                  |
| PRIORITY_1         | CHAR      | 22    | 6      |                  |
| PRIORITY_2         | CHAR      | 28    | 6      |                  |
| PRIORITY_3         | CHAR      | 34    | 6      |                  |
| PRIORITY_4         | CHAR      | 40    | 6      |                  |
| PRIORITY_5         | CHAR      | 46    | 6      |                  |
| PRIORITY_6         | CHAR      | 52    | 6      |                  |
| PRIORITY_7         | CHAR      | 58    | 6      |                  |
| PRIORITY_8         | CHAR      | 64    | 6      |                  |
| PRIORITY_9         | CHAR      | 70    | 6      |                  |
| PRIORITY_10        | CHAR      | 76    | 6      |                  |
| PRIORITY_11        | CHAR      | 82    | 6      |                  |
| PRIORITY_12        | CHAR      | 88    | 6      |                  |
| PRIORITY_13        | CHAR      | 94    | 6      |                  |
| PRIORITY_14        | CHAR      | 100   | 6      |                  |
| PRIORITY_15        | CHAR      | 106   | 6      |                  |
| PRIORITY_16        | CHAR      | 112   | 6      |                  |
| PRIORITY_17        | CHAR      | 118   | 6      |                  |
| PRIORITY_18        | CHAR      | 124   | 6      |                  |
| PRIORITY_19        | CHAR      | 130   | 6      |                  |
| PRIORITY_20        | CHAR      | 136   | 6      |                  |
| PRIORITY_21        | CHAR      | 142   | 6      |                  |
| PRIORITY_22        | CHAR      | 148   | 6      |                  |
| PRIORITY_23        | CHAR      | 154   | 6      |                  |
| PRIORITY_24        | CHAR      | 160   | 6      |                  |
| PRIORITY_25        | CHAR      | 166   | 6      |                  |
| OS6_UNUSED_2       | CHAR      | 172   | 12     |                  |
| **Keys:**          |           |       |        |                  |
| *Primary Key*      | CUST_DIV, CUST_CODE |       |        |                  |

### Table: `OS7_ItemCostPricePlan` - Item Cost Price Plan

| Field Name   | Data Type | Start | Length | Description |
| :----------- | :-------- | :---- | :----- | :---------- |
| ITEM_NUMBER  | CHAR      | 1     | 10     |             |
| PRICE_PLAN   | CHAR      | 11    | 6      |             |
| NET_QUANT_1  | CHAR      | 17    | 10     |             |
| NET_PRICE_1  | CHAR      | 27    | 10     |             |
| NET_QUANT_2  | CHAR      | 37    | 10     |             |
| NET_PRICE_2  | CHAR      | 47    | 10     |             |
| NET_QUANT_3  | CHAR      | 57    | 10     |             |
| NET_PRICE_3  | CHAR      | 67    | 10     |             |
| START_DATE   | DATE      | 77    | 6      |             |
| END_DATE     | DATE      | 83    | 6      |             |
| NET_PRICE_4  | CHAR      | 89    | 10     |             |
| NET_QUANT_4  | CHAR      | 99    | 10     |             |
| OS7_UNUSED_1 | CHAR      | 109   | 19     |             |
| **Keys:**    |           |       |        |             |
| *Primary Key*| ITEM_NUMBER, PRICE_PLAN |       |        |             |

### Table: `OS8_TransSendRep` - Transaction Send Report

| Field Name              | Data Type | Start | Length | Description                   |
| :---------------------- | :-------- | :---- | :----- | :---------------------------- |
| ORDER_DIV               | CHAR      | 1     | 2      | Order Division sent to United |
| ORDER_NUM               | CHAR      | 3     | 7      |                               |
| LINE_NUMBER             | CHAR      | 10    | 3      |                               |
| TRANSMISSION_REC_TYPE   | CHAR      | 13    | 1      |                               |
| BLANK                   | CHAR      | 14    | 5      |                               |
| DATA_STRING_FROM_UNITED | CHAR      | 19    | 494    |                               |
| **Keys:**               |           |       |        |                               |
| *Primary Key*           | ORDER_DIV, ORDER_NUM, LINE_NUMBER, TRANSMISSION_REC_TYPE, BLANK |       |        |                               |

### OFG_AddlOrdLnsItem Table Definition

| Field Name        | Data Type | Start | Length | Description   |
| :---------------- | :-------- | :---- | :----- | :------------ |
| CUST_DIV          | CHAR      | 1     | 2      | Customer code |
| CUST_CODE         | CHAR      | 3     | 8      |               |
| ITEM_CODE         | CHAR      | 11    | 10     |               |
| SEQ_NUM           | CHAR      | 21    | 3      |               |
| FOG_NUM           | CHAR      | 24    | 8      |               |
| FOG_LN_NUM        | CHAR      | 32    | 3      |               |
| LINE_TYPE         | CHAR      | 35    | 1      |               |
| CUST_ITEM_LN_TYPE | CHAR      | 36    | 1      |               |
| PO_CODE           | CHAR      | 37    | 1      |               |
| CUST_DIV_2        | CHAR      | 38    | 2      |               |
| CUST_CODE_2       | CHAR      | 40    | 8      |               |
| ITEM_CODE_2       | CHAR      | 48    | 20     |               |
| TF_DESCRIPTION    | CHAR      | 68    | 40     |               |
| VEND_DIV          | CHAR      | 108   | 2      |               |
| VEND_CODE         | CHAR      | 110   | 8      |               |
| PLANT_CODE        | CHAR      | 118   | 4      |               |
| STARTING_NUM      | CHAR      | 122   | 9      |               |
| ENDING_NUM        | CHAR      | 131   | 9      |               |
| SELLING_UNIT      | CHAR      | 140   | 4      |               |
| VEND_JOB_NUM      | CHAR      | 144   | 12     |               |
| VEND_JOB_DATE     | CHAR      | 156   | 6      |               |
| SHIP_FROM_WHSE    | CHAR      | 162   | 4      |               |
| SPECIAL_SHIP      | CHAR      | 166   | 1      |               |
| FOG_ERROR         | CHAR      | 167   | 1      |               |
| OFG_UNUSED_1      | CHAR      | 168   | 54     |               |
| SELL_QTY_PER_U    | NUMBER    |       | 5.2    |               |
| PRICE_PER_UNIT    | NUMBER    |       | 6.2    |               |
| COST_PER_UNIT     | NUMBER    |       | 6.2    |               |
| QTY_ORDERED       | NUMBER    |       | 8.2    |               |
| CARTON_PACK       | NUMBER    |       | 5.2    |               |
| OFG_UNUSED_2      | NUMBER    |       | 10.2   |               |
| OFG_UNUSED_3      | NUMBER    |       | 10.2   |               |
| OFG_UNUSED_4      | NUMBER    |       | 10.2   |               |
| **Keys:**         |           |       |        |               |
| *Primary Key*     | CUST_DIV, CUST_CODE, ITEM_CODE, SEQ_NUM |       |        |               |

### OFH_VendMap Table Definition

| Field Name     | Data Type | Start | Length | Description |
| :------------- | :-------- | :---- | :----- | :---------- |
| IN_VENDOR_CODE | CHAR      | 1     | 10     |             |
| VENDOR         | CHAR      | 11    | 10     |             |
| **Keys:**      |           |       |        |             |
| *Primary Key*  | IN_VENDOR_CODE |       |        |             |

### OR1_PickPri Table Definition

| Field Name      | Data Type | Start | Length | Description |
| :-------------- | :-------- | :---- | :----- | :---------- |
| PICK_PRIORITY   | CHAR      | 1     | 2      |             |
| PICK_PRI_DESC   | CHAR      | 3     | 30     |             |
| PICK_PRI_UNUSED | CHAR      | 33    | 95     |             |
| **Keys:**       |           |       |        |             |
| *Primary Key*   | PICK_PRIORITY |       |        |             |

### OS0_Off_Supp Table Definition

| Field Name        | Data Type | Start | Length | Description             |
| :---------------- | :-------- | :---- | :----- | :---------------------- |
| ITEM_NUM_KEY      | CHAR      | 1     | 10     |                         |
| SOURCE            | CHAR      | 11    | 3      |                         |
| VERSION           | CHAR      | 14    | 3      |                         |
| CUST_DIV          | CHAR      | 17    | 2      |                         |
| CUST_CODE         | CHAR      | 19    | 8      |                         |
| ITEM_CODE         | CHAR      | 27    | 10     |                         |
| TF_DESC           | CHAR      | 37    | 40     |                         |
| PROD_CODE         | CHAR      | 77    | 3      |                         |
| LEFT_RIGHT        | CHAR      | 80    | 8      |                         |
| TOP_BOTTOM        | CHAR      | 88    | 8      |                         |
| PLYS              | CHAR      | 96    | 2      |                         |
| SUPPLY_DIV        | CHAR      | 98    | 2      |                         |
| SUPPLY_CODE       | CHAR      | 100   | 8      |                         |
| PLANT_CODE        | CHAR      | 108   | 4      |                         |
| LAST_SOLD         | DATE      | 112   | 6      |                         |
| LAST_PURCH        | DATE      | 118   | 6      |                         |
| STAT_FLAG         | CHAR      | 124   | 1      | "Status Flag, I=Inactive" |
| ITEM_PRICE_CLASS  | CHAR      | 125   | 3      |                         |
| LOT_INVT          | CHAR      | 128   | 1      |                         |
| QTY_BRK_P_G       | CHAR      | 129   | 3      |                         |
| REQ_SECURE        | CHAR      | 132   | 1      |                         |
| TF_UNUSED         | CHAR      | 133   | 3      |                         |
| SELL_UNIT         | CHAR      | 136   | 4      |                         |
| INVT_UM           | CHAR      | 140   | 4      |                         |
| DESC_01           | CHAR      | 144   | 40     |                         |
| FORM_GROUP        | CHAR      | 184   | 10     |                         |
| PRICE_FEATURES    | CHAR      | 194   | 10     |                         |
| BASE_PRICE        | CHAR      | 204   | 10     |                         |
| QTY_BRK_1         | CHAR      | 214   | 10     |                         |
| QTY_PRC_1         | CHAR      | 224   | 10     |                         |
| QTY_BRK_2         | CHAR      | 234   | 10     |                         |
| QTY_PRC_2         | CHAR      | 244   | 10     |                         |
| QTY_BRK_3         | CHAR      | 254   | 10     |                         |
| QTY_PRC_3         | CHAR      | 264   | 10     |                         |
| QTY_BRK_4         | CHAR      | 274   | 10     |                         |
| QTY_PRC_4         | CHAR      | 284   | 10     |                         |
| QTY_BRK_5         | CHAR      | 294   | 10     |                         |
| QTY_PRC_5         | CHAR      | 304   | 10     |                         |
| QTY_BRK_6         | CHAR      | 314   | 10     |                         |
| QTY_PRC_6         | CHAR      | 324   | 10     |                         |
| AVG_SALES_PRICE   | CHAR      | 334   | 10     |                         |
| SELL_Q_U          | CHAR      | 344   | 10     |                         |
| INVT_Q_U          | CHAR      | 354   | 10     |                         |
| CTN_WT            | CHAR      | 364   | 10     |                         |
| LAST_PURCH_COST   | CHAR      | 374   | 10     |                         |
| AVG_COST          | CHAR      | 384   | 10     |                         |
| CTN_PACK          | CHAR      | 394   | 10     |                         |
| SPER_UNIT_COST    | CHAR      | 404   | 10     |                         |
| QTY_BRK_7         | CHAR      | 414   | 10     |                         |
| QTY_PRC_7         | CHAR      | 424   | 10     |                         |
| QTY_BRK_8         | CHAR      | 434   | 10     |                         |
| QTY_PRC_8         | CHAR      | 444   | 10     |                         |
| QTY_BRK_9         | CHAR      | 454   | 10     |                         |
| QTY_PRC_9         | CHAR      | 464   | 10     |                         |
| QTY_BRK_10        | CHAR      | 474   | 10     |                         |
| QTY_PRC_10        | CHAR      | 484   | 10     |                         |
| QTY_BRK_11        | CHAR      | 494   | 10     |                         |
| QTY_PRC_11        | CHAR      | 504   | 10     |                         |
| QTY_BRK_12        | CHAR      | 514   | 10     |                         |
| QTY_PRC_12        | CHAR      | 524   | 10     |                         |
| VENDOR_DIV        | CHAR      | 534   | 2      |                         |
| VENDOR_CODE       | CHAR      | 536   | 8      |                         |
| PLANT_CODE_2      | CHAR      | 544   | 4      |                         |
| SUPP_ITEM_NUM     | CHAR      | 548   | 20     |                         |
| PURCH_UM          | CHAR      | 568   | 4      |                         |
| DATE_LAST_PURCH   | DATE      | 572   | 6      |                         |
| BASE_COST         | CHAR      | 578   | 10     |                         |
| BRK_QTY_1         | CHAR      | 588   | 10     |                         |
| QTY_COST_1        | CHAR      | 598   | 10     |                         |
| BRK_QTY_2         | CHAR      | 608   | 10     |                         |
| QTY_COST_2        | CHAR      | 618   | 10     |                         |
| BRK_QTY_3         | CHAR      | 628   | 10     |                         |
| QTY_COST_3        | CHAR      | 638   | 10     |                         |
| BRK_QTY_4         | CHAR      | 648   | 10     |                         |
| QTY_COST_4        | CHAR      | 658   | 10     |                         |
| BRK_QTY_5         | CHAR      | 668   | 10     |                         |
| QTY_COST_5        | CHAR      | 678   | 10     |                         |
| BRK_QTY_6         | CHAR      | 688   | 10     |                         |
| QTY_COST_6        | CHAR      | 698   | 10     |                         |
| LAST_COST         | CHAR      | 708   | 10     |                         |
| QTY_PER_UM        | CHAR      | 718   | 10     |                         |
| CTN_WT_2          | CHAR      | 728   | 10     |                         |
| CTN_PACK_2        | CHAR      | 738   | 10     |                         |
| UNUSED_2          | CHAR      | 748   | 52     |                         |
| **Keys:**         |           |       |        |                         |
| *Primary Key*     | ITEM_NUM_KEY |       |        |                         |
| *Alternate Key 1* | SUPP_ITEM_NUM |       |        |                         |

### OS1_Price_Plan Table Definition

| Field Name      | Data Type | Start | Length | Description |
| :-------------- | :-------- | :---- | :----- | :---------- |
| ITEM_CODE       | CHAR      | 1     | 10     |             |
| PRICE_PLAN_CODE | CHAR      | 11    | 6      |             |
| HOW_PRICED      | CHAR      | 17    | 1      |             |
| FLYER_PRICE     | CHAR      | 18    | 1      |             |
| OS1_UNUSED_1    | CHAR      | 19    | 6      |             |
| START_DATE      | DATE      | 25    | 6      |             |
| END_DATE        | DATE      | 31    | 6      |             |
| BENCHMARK       | CHAR      | 37    | 10     |             |
| CALC_PRICE      | CHAR      | 47    | 10     |             |
| TF_COST         | CHAR      | 57    | 10     |             |
| OS1_UNUSED_3    | CHAR      | 67    | 170    |             |
| BASE_PRICE      | CHAR      | 237   | 10     |             |
| OS1_UNUSED_4    | CHAR      | 247   | 2      |             |
| OS1_UNUSED_5    | CHAR      | 249   | 1      |             |
| **Keys:**       |           |       |        |             |
| *Primary Key*   | ITEM_CODE, PRICE_PLAN_CODE |       |        |             |

### OS2_ItemPrimInfo Table Definition

| Field Name       | Data Type | Start | Length | Description |
| :--------------- | :-------- | :---- | :----- | :---------- |
| ITEM_NUMBER      | CHAR      | 1     | 10     |             |
| TF_PREFIX        | CHAR      | 11    | 3      |             |
| STOCK_NUM_BUTT   | CHAR      | 14    | 12     |             |
| LIST_PRICE       | CHAR      | 26    | 10     |             |
| RETAIL_UM        | CHAR      | 36    | 4      |             |
| STOCK_NUM_UNBUTT | CHAR      | 40    | 12     |             |
| DATE_LAST_TAPE   | DATE      | 52    | 6      |             |
| LOAD_SOURCE      | CHAR      | 58    | 1      |             |
| UNITED_UM        | CHAR      | 59    | 2      |             |
| IMAGE_NAME       | CHAR      | 61    | 15     |             |
| ADDL_NAME        | CHAR      | 76    | 15     |             |
| OS2_UNUSED_2     | CHAR      | 91    | 38     |             |
| **Keys:**        |           |       |        |             |
| *Primary Key*    | ITEM_NUMBER |       |        |             |

### OS3_FileLayPrint Table Definition

| Field Name   | Data Type | Start | Length | Description |
| :----------- | :-------- | :---- | :----- | :---------- |
| ERROR_CODE   | CHAR      | 1     | 6      |             |
| DESC_1       | CHAR      | 7     | 60     |             |
| DESC_2       | CHAR      | 67    | 60     |             |
| ERROR_TYPE   | CHAR      | 127   | 1      |             |
| OS3_UNUSED_1 | CHAR      | 128   | 3      |             |
| **Keys:**    |           |       |        |             |
| *Primary Key*| ERROR_CODE|       |        |             |

### OS4_TransErrRep Table Definition

| Field Name              | Data Type | Start | Length | Description             |
| :---------------------- | :-------- | :---- | :----- | :---------------------- |
| ORDER_DIV               | CHAR      | 1     | 2      |                         |
| ORDER_NUM               | CHAR      | 3     | 7      |                         |
| LINE_NUMBER             | CHAR      | 10    | 3      |                         |
| TRANSMISSION_REC_TYPE   | CHAR      | 13    | 1      |                         |
| BLANK                   | CHAR      | 14    | 5      |                         |
| DATA_STRING_FROM_UNITED | CHAR      | 19    | 494    |                         |
| **Keys:**               |           |       |        |                         |
| *Primary Key*           | ORDER_DIV, ORDER_NUM, LINE_NUMBER, TRANSMISSION_REC_TYPE, BLANK |       |        |                         |

### OS6_PricePlanPriorities Table Definition

| Field Name         | Data Type | Start | Length | Description      |
| :----------------- | :-------- | :---- | :----- | :--------------- |
| CUST_DIV           | CHAR      | 1     | 2      |                  |
| CUST_CODE          | CHAR      | 3     | 8      |                  |
| PRICE_TYPE         | CHAR      | 11    | 1      |                  |
| ALLOW_ZERO_PRICE   | CHAR      | 12    | 1      |                  |
| OS6_UNUSED_1       | CHAR      | 13    | 9      |                  |
| PRIORITY_1         | CHAR      | 22    | 6      |                  |
| PRIORITY_2         | CHAR      | 28    | 6      |                  |
| PRIORITY_3         | CHAR      | 34    | 6      |                  |
| PRIORITY_4         | CHAR      | 40    | 6      |                  |
| PRIORITY_5         | CHAR      | 46    | 6      |                  |
| PRIORITY_6         | CHAR      | 52    | 6      |                  |
| PRIORITY_7         | CHAR      | 58    | 6      |                  |
| PRIORITY_8         | CHAR      | 64    | 6      |                  |
| PRIORITY_9         | CHAR      | 70    | 6      |                  |
| PRIORITY_10        | CHAR      | 76    | 6      |                  |
| PRIORITY_11        | CHAR      | 82    | 6      |                  |
| PRIORITY_12        | CHAR      | 88    | 6      |                  |
| PRIORITY_13        | CHAR      | 94    | 6      |                  |
| PRIORITY_14        | CHAR      | 100   | 6      |                  |
| PRIORITY_15        | CHAR      | 106   | 6      |                  |
| PRIORITY_16        | CHAR      | 112   | 6      |                  |
| PRIORITY_17        | CHAR      | 118   | 6      |                  |
| PRIORITY_18        | CHAR      | 124   | 6      |                  |
| PRIORITY_19        | CHAR      | 130   | 6      |                  |
| PRIORITY_20        | CHAR      | 136   | 6      |                  |
| PRIORITY_21        | CHAR      | 142   | 6      |                  |
| PRIORITY_22        | CHAR      | 148   | 6      |                  |
| PRIORITY_23        | CHAR      | 154   | 6      |                  |
| PRIORITY_24        | CHAR      | 160   | 6      |                  |
| PRIORITY_25        | CHAR      | 166   | 6      |                  |
| OS6_UNUSED_2       | CHAR      | 172   | 12     |                  |
| **Keys:**          |           |       |        |                  |
| *Primary Key*      | CUST_DIV, CUST_CODE |       |        |                  |

### Table: `OS7_ItemCostPricePlan` - Item Cost Price Plan

| Field Name   | Data Type | Start | Length | Description |
| :----------- | :-------- | :---- | :----- | :---------- |
| ITEM_NUMBER  | CHAR      | 1     | 10     |             |
| PRICE_PLAN   | CHAR      | 11    | 6      |             |
| NET_QUANT_1  | CHAR      | 17    | 10     |             |
| NET_PRICE_1  | CHAR      | 27    | 10     |             |
| NET_QUANT_2  | CHAR      | 37    | 10     |             |
| NET_PRICE_2  | CHAR      | 47    | 10     |             |
| NET_QUANT_3  | CHAR      | 57    | 10     |             |
| NET_PRICE_3  | CHAR      | 67    | 10     |             |
| START_DATE   | DATE      | 77    | 6      |             |
| END_DATE     | DATE      | 83    | 6      |             |
| NET_PRICE_4  | CHAR      | 89    | 10     |             |
| NET_QUANT_4  | CHAR      | 99    | 10     |             |
| OS7_UNUSED_1 | CHAR      | 109   | 19     |             |
| **Keys:**    |           |       |        |             |
| *Primary Key*| ITEM_NUMBER, PRICE_PLAN |       |        |             |

### Table: `OS8_TransSendRep` - Transaction Send Report

| Field Name              | Data Type | Start | Length | Description                   |
| :---------------------- | :-------- | :---- | :----- | :---------------------------- |
| ORDER_DIV               | CHAR      | 1     | 2      | Order Division sent to United |
| ORDER_NUM               | CHAR      | 3     | 7      |                               |
| LINE_NUMBER             | CHAR      | 10    | 3      |                               |
| TRANSMISSION_REC_TYPE   | CHAR      | 13    | 1      |                               |
| BLANK                   | CHAR      | 14    | 5      |                               |
| DATA_STRING_FROM_UNITED | CHAR      | 19    | 494    |                               |
| **Keys:**               |           |       |        |                               |
| *Primary Key*           | ORDER_DIV, ORDER_NUM, LINE_NUMBER, TRANSMISSION_REC_TYPE, BLANK |       |        |                               |

### OFG_AddlOrdLnsItem Table Definition

| Field Name        | Data Type | Start | Length | Description   |
| :---------------- | :-------- | :---- | :----- | :------------ |
| CUST_DIV          | CHAR      | 1     | 2      | Customer code |
| CUST_CODE         | CHAR      | 3     | 8      |               |
| ITEM_CODE         | CHAR      | 11    | 10     |               |
| SEQ_NUM           | CHAR      | 21    | 3      |               |
| FOG_NUM           | CHAR      | 24    | 8      |               |
| FOG_LN_NUM        | CHAR      | 32    | 3      |               |
| LINE_TYPE         | CHAR      | 35    | 1      |               |
| CUST_ITEM_LN_TYPE | CHAR      | 36    | 1      |               |
| PO_CODE           | CHAR      | 37    | 1      |               |
| CUST_DIV_2        | CHAR      | 38    | 2      |               |
| CUST_CODE_2       | CHAR      | 40    | 8      |               |
| ITEM_CODE_2       | CHAR      | 48    | 20     |               |
| TF_DESCRIPTION    | CHAR      | 68    | 40     |               |
| VEND_DIV          | CHAR      | 108   | 2      |               |
| VEND_CODE         | CHAR      | 110   | 8      |               |
| PLANT_CODE        | CHAR      | 118   | 4      |               |
| STARTING_NUM      | CHAR      | 122   | 9      |               |
| ENDING_NUM        | CHAR      | 131   | 9      |               |
| SELLING_UNIT      | CHAR      | 140   | 4      |               |
| VEND_JOB_NUM      | CHAR      | 144   | 12     |               |
| VEND_JOB_DATE     | CHAR      | 156   | 6      |               |
| SHIP_FROM_WHSE    | CHAR      | 162   | 4      |               |
| SPECIAL_SHIP      | CHAR      | 166   | 1      |               |
| FOG_ERROR         | CHAR      | 167   | 1      |               |
| OFG_UNUSED_1      | CHAR      | 168   | 54     |               |
| SELL_QTY_PER_U    | NUMBER    |       | 5.2    |               |
| PRICE_PER_UNIT    | NUMBER    |       | 6.2    |               |
| COST_PER_UNIT     | NUMBER    |       | 6.2    |               |
| QTY_ORDERED       | NUMBER    |       | 8.2    |               |
| CARTON_PACK       | NUMBER    |       | 5.2    |               |
| OFG_UNUSED_2      | NUMBER    |       | 10.2   |               |
| OFG_UNUSED_3      | NUMBER    |       | 10.2   |               |
| OFG_UNUSED_4      | NUMBER    |       | 10.2   |               |
| **Keys:**         |           |       |        |               |
| *Primary Key*     | CUST_DIV, CUST_CODE, ITEM_CODE, SEQ_NUM |       |        |               |

### OFH_VendMap Table Definition

| Field Name     | Data Type | Start | Length | Description |
| :------------- | :-------- | :---- | :----- | :---------- |
| IN_VENDOR_CODE | CHAR      | 1     | 10     |             |
| VENDOR         | CHAR      | 11    | 10     |             |
| **Keys:**      |           |       |        |             |
| *Primary Key*  | IN_VENDOR_CODE |       |        |             |

### OR1_PickPri Table Definition

| Field Name      | Data Type | Start | Length | Description |
| :-------------- | :-------- | :---- | :----- | :---------- |
| PICK_PRIORITY   | CHAR      | 1     | 2      |             |
| PICK_PRI_DESC   | CHAR      | 3     | 30     |             |
| PICK_PRI_UNUSED | CHAR      | 33    | 95     |             |
| **Keys:**       |           |       |        |             |
| *Primary Key*   | PICK_PRIORITY |       |        |             |

### OS0_Off_Supp Table Definition

| Field Name        | Data Type | Start | Length | Description             |
| :---------------- | :-------- | :---- | :----- | :---------------------- |
| ITEM_NUM_KEY      | CHAR      | 1     | 10     |                         |
| SOURCE            | CHAR      | 11    | 3      |                         |
| VERSION           | CHAR      | 14    | 3      |                         |
| CUST_DIV          | CHAR      | 17    | 2      |                         |
| CUST_CODE         | CHAR      | 19    | 8      |                         |
| ITEM_CODE         | CHAR      | 27    | 10     |                         |
| TF_DESC           | CHAR      | 37    | 40     |                         |
| PROD_CODE         | CHAR      | 77    | 3      |                         |
| LEFT_RIGHT        | CHAR      | 80    | 8      |                         |
| TOP_BOTTOM        | CHAR      | 88    | 8      |                         |
| PLYS              | CHAR      | 96    | 2      |                         |
| SUPPLY_DIV        | CHAR      | 98    | 2      |                         |
| SUPPLY_CODE       | CHAR      | 100   | 8      |                         |
| PLANT_CODE        | CHAR      | 108   | 4      |                         |
| LAST_SOLD         | DATE      | 112   | 6      |                         |
| LAST_PURCH        | DATE      | 118   | 6      |                         |
| STAT_FLAG         | CHAR      | 124   | 1      | "Status Flag, I=Inactive" |
| ITEM_PRICE_CLASS  | CHAR      | 125   | 3      |                         |
| LOT_INVT          | CHAR      | 128   | 1      |                         |
| QTY_BRK_P_G       | CHAR      | 129   | 3      |                         |
| REQ_SECURE        | CHAR      | 132   | 1      |                         |
| TF_UNUSED         | CHAR      | 133   | 3      |                         |
| SELL_UNIT         | CHAR      | 136   | 4      |                         |
| INVT_UM           | CHAR      | 140   | 4      |                         |
| DESC_01           | CHAR      | 144   | 40     |                         |
| FORM_GROUP        | CHAR      | 184   | 10     |                         |
| PRICE_FEATURES    | CHAR      | 194   | 10     |                         |
| BASE_PRICE        | CHAR      | 204   | 10     |                         |
| QTY_BRK_1         | CHAR      | 214   | 10     |                         |
| QTY_PRC_1         | CHAR      | 224   | 10     |                         |
| QTY_BRK_2         | CHAR      | 234   | 10     |                         |
| QTY_PRC_2         | CHAR      | 244   | 10     |                         |
| QTY_BRK_3         | CHAR      | 254   | 10     |                         |
| QTY_PRC_3         | CHAR      | 264   | 10     |                         |
| QTY_BRK_4         | CHAR      | 274   | 10     |                         |
| QTY_PRC_4         | CHAR      | 284   | 10     |                         |
| QTY_BRK_5         | CHAR      | 294   | 10     |                         |
| QTY_PRC_5         | CHAR      | 304   | 10     |                         |
| QTY_BRK_6         | CHAR      | 314   | 10     |                         |
| QTY_PRC_6         | CHAR      | 324   | 10     |                         |
| AVG_SALES_PRICE   | CHAR      | 334   | 10     |                         |
| SELL_Q_U          | CHAR      | 344   | 10     |                         |
| INVT_Q_U          | CHAR      | 354   | 10     |                         |
| CTN_WT            | CHAR      | 364   | 10     |                         |
| LAST_PURCH_COST   | CHAR      | 374   | 10     |                         |
| AVG_COST          | CHAR      | 384   | 10     |                         |
| CTN_PACK          | CHAR      | 394   | 10     |                         |
| SPER_UNIT_COST    | CHAR      | 404   | 10     |                         |
| QTY_BRK_7         | CHAR      | 414   | 10     |                         |
| QTY_PRC_7         | CHAR      | 424   | 10     |                         |
| QTY_BRK_8         | CHAR      | 434   | 10     |                         |
| QTY_PRC_8         | CHAR      | 444   | 10     |                         |
| QTY_BRK_9         | CHAR      | 454   | 10     |                         |
| QTY_PRC_9         | CHAR      | 464   | 10     |                         |
| QTY_BRK_10        | CHAR      | 474   | 10     |                         |
| QTY_PRC_10        | CHAR      | 484   | 10     |                         |
| QTY_BRK_11        | CHAR      | 494   | 10     |                         |
| QTY_PRC_11        | CHAR      | 504   | 10     |                         |
| QTY_BRK_12        | CHAR      | 514   | 10     |                         |
| QTY_PRC_12        | CHAR      | 524   | 10     |                         |
| VENDOR_DIV        | CHAR      | 534   | 2      |                         |
| VENDOR_CODE       | CHAR      | 536   | 8      |                         |
| PLANT_CODE_2      | CHAR      | 544   | 4      |                         |
| SUPP_ITEM_NUM     | CHAR      | 548   | 20     |                         |
| PURCH_UM          | CHAR      | 568   | 4      |                         |
| DATE_LAST_PURCH   | DATE      | 572   | 6      |                         |
| BASE_COST         | CHAR      | 578   | 10     |                         |
| BRK_QTY_1         | CHAR      | 588   | 10     |                         |
| QTY_COST_1        | CHAR      | 598   | 10     |                         |
| BRK_QTY_2         | CHAR      | 608   | 10     |                         |
| QTY_COST_2        | CHAR      | 618   | 10     |                         |
| BRK_QTY_3         | CHAR      | 628   | 10     |                         |
| QTY_COST_3        | CHAR      | 638   | 10     |                         |
| BRK_QTY_4         | CHAR      | 648   | 10     |                         |
| QTY_COST_4        | CHAR      | 658   | 10     |                         |
| BRK_QTY_5         | CHAR      | 668   | 10     |                         |
| QTY_COST_5        | CHAR      | 678   | 10     |                         |
| BRK_QTY_6         | CHAR      | 688   | 10     |                         |
| QTY_COST_6        | CHAR      | 698   | 10     |                         |
| LAST_COST         | CHAR      | 708   | 10     |                         |
| QTY_PER_UM        | CHAR      | 718   | 10     |                         |
| CTN_WT_2          | CHAR      | 728   | 10     |                         |
| CTN_PACK_2        | CHAR      | 738   | 10     |                         |
| UNUSED_2          | CHAR      | 748   | 52     |                         |
| **Keys:**         |           |       |        |                         |
| *Primary Key*     | ITEM_NUM_KEY |       |        |                         |
| *Alternate Key 1* | SUPP_ITEM_NUM |       |        |                         |

### OS1_Price_Plan Table Definition

| Field Name      | Data Type | Start | Length | Description |
| :-------------- | :-------- | :---- | :----- | :---------- |
| ITEM_CODE       | CHAR      | 1     | 10     |             |
| PRICE_PLAN_CODE | CHAR      | 11    | 6      |             |
| HOW_PRICED      | CHAR      | 17    | 1      |             |
| FLYER_PRICE     | CHAR      | 18    | 1      |             |
| OS1_UNUSED_1    | CHAR      | 19    | 6      |             |
| START_DATE      | DATE      | 25    | 6      |             |
| END_DATE        | DATE      | 31    | 6      |             |
| BENCHMARK       | CHAR      | 37    | 10     |             |
| CALC_PRICE      | CHAR      | 47    | 10     |             |
| TF_COST         | CHAR      | 57    | 10     |             |
| OS1_UNUSED_3    | CHAR      | 67    | 170    |             |
| BASE_PRICE      | CHAR      | 237   | 10     |             |
| OS1_UNUSED_4    | CHAR      | 247   | 2      |             |
| OS1_UNUSED_5    | CHAR      | 249   | 1      |             |
| **Keys:**       |           |       |        |             |
| *Primary Key*   | ITEM_CODE, PRICE_PLAN_CODE |       |        |             |

### OS2_ItemPrimInfo Table Definition

| Field Name       | Data Type | Start | Length | Description |
| :--------------- | :-------- | :---- | :----- | :---------- |
| ITEM_NUMBER      | CHAR      | 1     | 10     |             |
| TF_PREFIX        | CHAR      | 11    | 3      |             |
| STOCK_NUM_BUTT   | CHAR      | 14    | 12     |             |
| LIST_PRICE       | CHAR      | 26    | 10     |             |
| RETAIL_UM        | CHAR      | 36    | 4      |             |
| STOCK_NUM_UNBUTT | CHAR      | 40    | 12     |             |
| DATE_LAST_TAPE   | DATE      | 52    | 6      |             |
| LOAD_SOURCE      | CHAR      | 58    | 1      |             |
| UNITED_UM        | CHAR      | 59    | 2      |             |
| IMAGE_NAME       | CHAR      | 61    | 15     |             |
| ADDL_NAME        | CHAR      | 76    | 15     |             |
| OS2_UNUSED_2     | CHAR      | 91    | 38     |             |
| **Keys:**        |           |       |        |             |
| *Primary Key*    | ITEM_NUMBER |       |        |             |

### OS3_FileLayPrint Table Definition

| Field Name   | Data Type | Start | Length | Description |
| :----------- | :-------- | :---- | :----- | :---------- |
| ERROR_CODE   | CHAR      | 1     | 6      |             |
| DESC_1       | CHAR      | 7     | 60     |             |
| DESC_2       | CHAR      | 67    | 60     |             |
| ERROR_TYPE   | CHAR      | 127   | 1      |             |
| OS3_UNUSED_1 | CHAR      | 128   | 3      |             |
| **Keys:**    |           |       |        |             |
| *Primary Key*| ERROR_CODE|       |        |             |

### OS4_TransErrRep Table Definition

| Field Name              | Data Type | Start | Length | Description             |
| :---------------------- | :-------- | :---- | :----- | :---------------------- |
| ORDER_DIV               | CHAR      | 1     | 2      |                         |
| ORDER_NUM               | CHAR      | 3     | 7      |                         |
| LINE_NUMBER             | CHAR      | 10    | 3      |                         |
| TRANSMISSION_REC_TYPE   | CHAR      | 13    | 1      |                         |
| BLANK                   | CHAR      | 14    | 5      |                         |
| DATA_STRING_FROM_UNITED | CHAR      | 19    | 494    |                         |
| **Keys:**               |           |       |        |                         |
| *Primary Key*           | ORDER_DIV, ORDER_NUM, LINE_NUMBER, TRANSMISSION_REC_TYPE, BLANK |       |        |                         |

### OS6_PricePlanPriorities Table Definition

| Field Name         | Data Type | Start | Length | Description      |
| :----------------- | :-------- | :---- | :----- | :--------------- |
| CUST_DIV           | CHAR      | 1     | 2      |                  |
| CUST_CODE          | CHAR      | 3     | 8      |                  |
| PRICE_TYPE         | CHAR      | 11    | 1      |                  |
| ALLOW_ZERO_PRICE   | CHAR      | 12    | 1      |                  |
| OS6_UNUSED_1       | CHAR      | 13    | 9      |                  |
| PRIORITY_1         | CHAR      | 22    | 6      |                  |
| PRIORITY_2         | CHAR      | 28    | 6      |                  |
| PRIORITY_3         | CHAR      | 34    | 6      |                  |
| PRIORITY_4         | CHAR      | 40    | 6      |                  |
| PRIORITY_5         | CHAR      | 46    | 6      |                  |
| PRIORITY_6         | CHAR      | 52    | 6      |                  |
| PRIORITY_7         | CHAR      | 58    | 6      |                  |
| PRIORITY_8         | CHAR      | 64    | 6      |                  |
| PRIORITY_9         | CHAR      | 70    | 6      |                  |
| PRIORITY_10        | CHAR      | 76    | 6      |                  |
| PRIORITY_11        | CHAR      | 82    | 6      |                  |
| PRIORITY_12        | CHAR      | 88    | 6      |                  |
| PRIORITY_13        | CHAR      | 94    | 6      |                  |
| PRIORITY_14        | CHAR      | 100   | 6      |                  |
| PRIORITY_15        | CHAR      | 106   | 6      |                  |
| PRIORITY_16        | CHAR      | 112   | 6      |                  |
| PRIORITY_17        | CHAR      | 118   | 6      |                  |
| PRIORITY_18        | CHAR      | 124   | 6      |                  |
| PRIORITY_19        | CHAR      | 130   | 6      |                  |
| PRIORITY_20        | CHAR      | 136   | 6      |                  |
| PRIORITY_21        | CHAR      | 142   | 6      |                  |
| PRIORITY_22        | CHAR      | 148   | 6      |                  |
| PRIORITY_23        | CHAR      | 154   | 6      |                  |
| PRIORITY_24        | CHAR      | 160   | 6      |                  |
| PRIORITY_25        | CHAR      | 166   | 6      |                  |
| OS6_UNUSED_2       | CHAR      | 172   | 12     |                  |
| **Keys:**          |           |       |        |                  |
| *Primary Key*      | CUST_DIV, CUST_CODE |       |        |                  |

### Table: `OS7_ItemCostPricePlan` - Item Cost Price Plan

| Field Name   | Data Type | Start | Length | Description |
| :----------- | :-------- | :---- | :----- | :---------- |
| ITEM_NUMBER  | CHAR      | 1     | 10     |             |
| PRICE_PLAN   | CHAR      | 11    | 6      |             |
| NET_QUANT_1  | CHAR      | 17    | 10     |             |
| NET_PRICE_1  | CHAR      | 27    | 10     |             |
| NET_QUANT_2  | CHAR      | 37    | 10     |             |
| NET_PRICE_2  | CHAR      | 47    | 10     |             |
| NET_QUANT_3  | CHAR      | 57    | 10     |             |
| NET_PRICE_3  | CHAR      | 67    | 10     |             |
| START_DATE   | DATE      | 77    | 6      |             |
| END_DATE     | DATE      | 83    | 6      |             |
| NET_PRICE_4  | CHAR      | 89    | 10     |             |
| NET_QUANT_4  | CHAR      | 99    | 10     |             |
| OS7_UNUSED_1 | CHAR      | 109   | 19     |             |
| **Keys:**    |           |       |        |             |
| *Primary Key*| ITEM_NUMBER, PRICE_PLAN |       |        |             |

### Table: `OS8_TransSendRep` - Transaction Send Report

| Field Name              | Data Type | Start | Length | Description                   |
| :---------------------- | :-------- | :---- | :----- | :---------------------------- |
| ORDER_DIV               | CHAR      | 1     | 2      | Order Division sent to United |
| ORDER_NUM               | CHAR      | 3     | 7      |                               |
| LINE_NUMBER             | CHAR      | 10    | 3      |                               |
| TRANSMISSION_REC_TYPE   | CHAR      | 13    | 1      |                               |
| BLANK                   | CHAR      | 14    | 5      |                               |
| DATA_STRING_FROM_UNITED | CHAR      | 19    | 494    |                               |
| **Keys:**               |           |       |        |                               |
| *Primary Key*           | ORDER_DIV, ORDER_NUM, LINE_NUMBER, TRANSMISSION_REC_TYPE, BLANK |       |        |                               |

```
{{ ... }}
### Table: `OF4_OEGPOHdr` - Purchase Order Header
{{ ... }}
### Table: `OF5_OEGPOCmnt` - Purchase Order Comments
{{ ... }}
### Table: `OF6_OEGOrderNote` - Order Notes
{{ ... }}
### Table: `OF7_OEGCustParms` - Customer Parameters
{{ ... }}
