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

- `A[0]`: *Purpose TBD (Potentially another cost/price field or a specialized value)*
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

- `A[0]`: *Purpose TBD (Potentially another cost/price field or a specialized value)*
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
{{ ... }}

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
| `GB_LIFO_COST`         | DECIMAL(14_3) |        | Yes      |             |               | GL LIFO Cost (Schema: IC0_UNUSED_3)                                        |

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

### Table: `IC8_TransSendRep` - Transaction Send Report

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

## Database Schema

This section outlines the proposed schema for the modernized DemandBridge database, derived from analysis of the legacy system.

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
| `VEND_DIV`             | CHAR      | 2      |     | Vendor Number          |
| `VEND_CODE`            | CHAR      | 8      |     |                        |
| `PLANT_CODE`           | CHAR      | 4      |     | Plant number           |
| `STARTING_NUM`         | CHAR      | 9      |     | Starting number        |
| `ENDING_NUM`           | CHAR      | 9      |     | Ending number          |
| `BIN_LOC`              | CHAR      | 10     |     | Bin number             |
| `ORDER_DIV`            | CHAR      | 2      |     | Order number           |
| `ORDER_NUM`            | CHAR      | 6      |     |                        |
| `ORDER_LINE_NUM`       | CHAR      | 3      |     | Line number on order   |
| `PRIMARY_UM`           | CHAR      | 4      |     | Primary unit           |
| `PACKAGING_UM`         | CHAR      | 4      |     | Packaging unit         |
| `UM`                   | CHAR      | 4      |     | U/M                    |
| `CUST_PO`              | CHAR      | 15     |     | Customer PO            |
| `BILLED_ON_INV_NUM`    | CHAR      | 7      |     | Billed on invoice number|
| `SHORT_OR_BROKEN`      | CHAR      | 1      |     | Y = Short or broken carton|
| `TF_COMMENT`           | CHAR      | 40     |     | Comment field          |
| `RECVG_AUDIT_NUM`      | CHAR      | 6      |     | Received audit control number|
| `RELEASED_ON_INV_NUM`  | CHAR      | 7      |     | Released on invoice number|
| `RELEASED_AUDIT_NUM`   | CHAR      | 6      |     | Released Audit Control number|
| `ITEM_REV_DATE`        | CHAR      | 6      |     | Form Revision Date     |
| `ICM_UNUSED_1`         | CHAR      | 13     |     | *DO NOT USE - USED in ICF for flags|
| `LOT_NUM`              | CHAR      | 8      |     | Lot Number (4.0)       |
| `PROD_CODE_OVERRIDE`   | CHAR      | 3      |     | Product Code Override (4.0)|
| `COMM_CODE_OVERRIDE`   | CHAR      | 5      |     | Commission Code Override (4.0)|
| `STORAGE_EXP_DATE`     | DATE      | 6      |     | Storage Expiration Date (4.0)|
| `STND_COST_UOM`        | CHAR      | 4      |     | Standard Cost Unit of Measure (4.0)|
| `ICN_UNUSED_2`         | CHAR      | 10     |     | *Ununsed              |
| `TOTAL_COST`           | NUMBER    | 14     | 3   | Total cost             |
| `TOTAL_FRT`            | NUMBER    | 14     | 3   | Total Freight          |
| `UNITS_PER_PACK`       | NUMBER    | 14     | 3   | Units Per Pack         |
| `UNITS_PER_PRIMARY`    | NUMBER    | 14     | 3   | Units Per Primary Packing Unit|
| `ORDER_QTY`            | NUMBER    | 14     | 3   | Order Qty              |
| `ORDER_SALES_PRICE`    | NUMBER    | 14     | 3   | Order Sales Price      |
| `SALES_PRICE_QTY_UM`   | NUMBER    | 14     | 3   | Sales Price Qty UM     |
| `STND_UNIT_COST`       | NUMBER    | 14     | 3   | Standard Unit Cost     |
| `STND_COST_QTY`        | NUMBER    | 14     | 3   | Standard Cost Qty      |
| `ICN_UNUSED_3`         | NUMBER    | 14     | 3   | ICN Unused 3          |
| `ICN_UNUSED_4`         | NUMBER    | 14     | 3   | ICN Unused 4          |
| `ICN_UNUSED_5`         | NUMBER    | 14     | 3   | ICN Unused 5          |
| `ICN_UNUSED_6`         | NUMBER    | 14     | 3   | ICN Unused 6          |

**Keys:**
- Primary Key: `CUST_DIV`, `CUST_CODE`, `ITEM_CODE`, `PO_DIV`, `PO_NUM`, `WHSE`, `ICM_UNUSED_1`

### Table: `ICN_OrderEntLotRet` - Order Entry Lot Return

This table appears to handle lot information related to order entry returns.

{{ ... }}
| `CUST_DIV`             | CHAR      | 2      |     | Customer number                        |
{{ ... }}Number                             |
| `PO_DIV`               | CHAR      | 2      |     | P/O number                             |
{{ ... }}Number                             |
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
| `BILLED_ON_INV_NUM`    | CHAR      | 7      |     | Billed on invoice number               |
| `SHORT_OR_BROKEN`      | CHAR      | 1      |     | Y = Short or broken carton             |
| `TF_COMMENT`           | CHAR      | 40     |     | Comment field                          |
| `RECVG_AUDIT_NUM`      | CHAR      | 6      |     | Received audit control number          |
| `RELEASED_ON_INV_NUM`  | CHAR      | 7      |     | Released on invoice number             |
| `RELEASED_AUDIT_NUM`   | CHAR      | 6      |     | Released Audit Control number          |
| `ITEM_REV_DATE`        | CHAR      | 6      |     | Form Revision Date                     |
| `ICN_UNUSED_1`         | CHAR      | 13     |     | *DO NOT USE - USED in ICF for flags    |
| `LOT_NUM`              | CHAR      | 8      |     | Lot Number (4.0)                       |
| `PROD_CODE_OVERRIDE`   | CHAR      | 3      |     | Product Code Override (4.0)            |
| `COMM_CODE_OVERRIDE`   | CHAR      | 5      |     | Commission Code Override (4.0)         |
| `STORAGE_EXP_DATE`     | DATE      | 6      |     | Storage Expiration Date (4.0)          |
| `STND_COST_UOM`        | CHAR      | 4      |     | Standard Cost Unit of Measure (4.0)    |
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

## General Ledger (GL) Module

### Table: GL1_AccountMaster

| Field Name          | Data Type | Start | Length | Dec  | Description                             |
| :------------------- | :-------- | :---- | :----- | :--- | :-------------------------------------- |
| GL_ACCT_DIV       | CHAR      | 1     | 2      |      | G/L Account Division (if division-specific COA)  |
| GL_ACCT_NUMBER    | CHAR      | 3     | 15     |      | Full G/L Account Number (e.g., 1000-00-00-ASSET) |
| GL_ACCT_DESC      | CHAR      | 18    | 40     |      | Account Description                      |
| GL_ACCT_TYPE      | CHAR      | 58    | 1      |      | (A=Asset, L=Liability, E=Equity, R=Revenue, C=COGS, X=Expense, O=Other) |
| GL_ACCT_CATEGORY  | CHAR      | 59    | 10     |      | Account Category/Sub-Type (e.g., CASH, AR, AP)   |
| NORMAL_BALANCE    | CHAR      | 69    | 1      |      | (D=Debit, C=Credit) Normal Balance of Account    |
| ALLOW_POSTING_FLAG| CHAR      | 70    | 1      |      | (Y/N) Allow direct journal entries to this account?|
| IS_CONTROL_ACCT   | CHAR      | 71    | 1      |      | (Y/N) Is this a control account (e.g., for AR, AP, INV)? |
| CONTROL_MODULE    | CHAR      | 72    | 3      |      | (AR, AP, IC, PO, SO, FA) Module it controls (if IS_CONTROL_ACCT='Y') |
| STATUS_CODE       | CHAR      | 75    | 1      |      | (A=Active, I=Inactive) Account Status            |
| DATE_CREATED      | DATE      | 76    | 6      |      | Date Account Created (YYMMDD)                    |
| DATE_INACTIVATED  | DATE      | 82    | 6      |      | Date Account Inactivated (YYMMDD)                |
| ROLLUP_ACCT_DIV   | CHAR      | 88    | 2      |      | Roll-up Account Division (for summary/parent)    |
| ROLLUP_ACCT_NUMBER| CHAR      | 90    | 15     |      | Roll-up Account Number (for summary/parent)      |
| BUDGET_ALLOWED    | CHAR      | 105   | 1      |      | (Y/N) Is budgeting allowed for this account?     |
| RECONCILIATION_FLAG| CHAR     | 106   | 1      |      | (Y/N) Is this account typically reconciled?      |
| USER_FIELD_1      | CHAR      | 107   | 20     |      | User Defined Field 1                             |
| USER_FIELD_2      | CHAR      | 127   | 20     |      | User Defined Field 2                             |
| GL1_UNUSED        | CHAR      | 147   | 53     |      | Unused Space                                     |

Total Record Length: 199 (Provisional - sum of specified lengths)

Keys:
Primary Key: GL_ACCT_DIV, GL_ACCT_NUMBER
Foreign Key (Self-Referential): (ROLLUP_ACCT_DIV, ROLLUP_ACCT_NUMBER) could reference GL1_AccountMaster (GL_ACCT_DIV, GL_ACCT_NUMBER) for hierarchical chart of accounts.
Alternate Key 1 (Example): GL_ACCT_DESC, GL_ACCT_DIV (if descriptions are unique within a division)

### Table: GL2_JournalHeader

| Field Name          | Data Type | Start | Length | Dec | Description                                      |
|--------------------|-----------|-------|--------|-----|--------------------------------------------------|
| JE_BATCH_ID      | CHAR      | 1     | 10     |     | Journal Entry Batch ID (system generated or user)  |
| JE_NUMBER        | CHAR      | 11    | 7      |     | Journal Entry Number (unique within batch/period)|
| JE_DATE           | DATE      | 18    | 6      |     | Journal Entry Date (YYMMDD)                      |
| JE_DESC           | CHAR      | 24    | 40     |     | Journal Entry Description                        |
| JE_SOURCE         | CHAR      | 64    | 3      |     | (MAN=Manual, AR, AP, IC, PR, FA, SO) Source Module |
| JE_TYPE           | CHAR      | 67    | 3      |     | (STD=Standard, REV=Reversing, REC=Recurring)   |
| REVERSAL_DATE     | DATE      | 70    | 6      |     | Date for Reversing Entry (if JE_TYPE='REV')    |
| RECUR_TEMPLATE_ID | CHAR      | 76    | 10     |     | Recurring Template ID (if JE_TYPE='REC')         |
| TOTAL_DEBITS      | NUMBER    | 86    | 15     | 2   | Total Debit Amount for this JE                   |
| TOTAL_CREDITS     | NUMBER    | 101   | 15     | 2   | Total Credit Amount for this JE                  |
| STATUS            | CHAR      | 116   | 1      |     | (U=Unposted, P=Posted, D=Deleted/Void)           |
| POSTING_DATE      | DATE      | 117   | 6      |     | Date JE was Posted (YYMMDD)                      |
| POSTING_PERIOD    | CHAR      | 123   | 2      |     | Fiscal Period JE was Posted to (e.g., 01-12)     |
| POSTING_YEAR      | CHAR      | 125   | 4      |     | Fiscal Year JE was Posted to (YYYY)              |
| CREATED_BY_USER   | CHAR      | 129   | 10     |     | User ID who created the JE                       |
| APPROVED_BY_USER  | CHAR      | 139   | 10     |     | User ID who approved the JE (if applicable)    |
| REFERENCE_DOC_NUM | CHAR      | 149   | 20     |     | External Reference Document Number               |
| GL2_UNUSED        | CHAR      | 169   | 31     |     | Unused Space                                     |

Total Record Length: 199 (Provisional - sum of specified lengths)

Keys:
Primary Key: JE_BATCH_ID, JE_NUMBER (Or potentially just JE_NUMBER if globally unique, or a system-generated unique ID)
Alternate Key 1 (Example): JE_DATE, JE_SOURCE, JE_NUMBER

### Table: GL3_JournalDetail

| Field Name         | Data Type | Start | Length | Dec | Description                                       |
|--------------------|-----------|-------|--------|-----|---------------------------------------------------|
| JE_BATCH_ID      | CHAR      | 1     | 10     |     | Journal Entry Batch ID (links to GL2)             |
| JE_NUMBER        | CHAR      | 11    | 7      |     | Journal Entry Number (links to GL2)               |
| LINE_NUMBER      | CHAR      | 18    | 3      |     | Journal Entry Line Number (e.g., 001, 002)        |
| GL_ACCT_DIV      | CHAR      | 21    | 2      |     | G/L Account Division (links to GL1)               |
| GL_ACCT_NUMBER   | CHAR      | 23    | 15     |     | G/L Account Number (links to GL1)                 |
| DEBIT_AMOUNT     | NUMBER    | 38    | 15     | 2   | Debit Amount for this line                        |
| CREDIT_AMOUNT    | NUMBER    | 53    | 15     | 2   | Credit Amount for this line                       |
| LINE_DESC        | CHAR      | 68    | 40     |     | Line Item Description                             |
| PROJECT_ID       | CHAR      | 108   | 10     |     | Project ID (if applicable, for job costing)       |
| DEPARTMENT_CODE  | CHAR      | 118   | 5      |     | Department Code (for departmental accounting)     |
| STAT_QTY         | NUMBER    | 123   | 10     | 2   | Statistical Quantity (e.g., units, hours)         |
| STAT_UOM         | CHAR      | 133   | 4      |     | Statistical Unit of Measure                       |
| SOURCE_DOC_REF   | CHAR      | 137   | 15     |     | Source Document Reference (e.g., Inv#, PO#)       |
| GL3_UNUSED       | CHAR      | 152   | 48     |     | Unused Space                                      |

Total Record Length: 199 (Provisional - sum of specified lengths)

Keys:
Primary Key: JE_BATCH_ID, JE_NUMBER, LINE_NUMBER
Foreign Key 1: (JE_BATCH_ID, JE_NUMBER) references GL2_JournalHeader (JE_BATCH_ID, JE_NUMBER)
Foreign Key 2: (GL_ACCT_DIV, GL_ACCT_NUMBER) references GL1_AccountMaster (GL_ACCT_DIV, GL_ACCT_NUMBER)

### Table: AP2_Term

| Field Name           | Data Type | Start | Length | Dec  | Description                             |
| :------------------- | :-------- | :---- | :----- | :--- | :-------------------------------------- |
| TERMS_CODE           | CHAR      | 1     | 2      |      | Terms Code                              |
| TERMS_DESC           | CHAR      | 3     | 30     |      | Terms Description                       |
| TERMS_TYPE           | CHAR      | 33    | 1      |      | "P=Period, E=End, N=Next, D=Day"        |
| DAYS_TILL_DUE        | CHAR      | 34    | 3      |      | Number of days until due                |
| DAYS_IN_PERIOD       | CHAR      | 37    | 2      |      | Day in month or Days in period          |
| CUTOFF_DAY_IN_MONTH  | CHAR      | 39    | 2      |      | Cutoff day for current month            |
| DUE_DATE_2ND         | CHAR      | 41    | 2      |      | Second Due Date                         |
| DISC_DUE_DATE_TYPE   | CHAR      | 43    | 1      |      | Discount due date type                  |
| DAYS_TILL_DUE_2ND    | CHAR      | 44    | 3      |      | Number of days until due (for discount) |
| DUE_DAY              | CHAR      | 47    | 2      |      | Enter the Due Day                       |
| CUTOFF_DAY_2ND       | CHAR      | 49    | 2      |      | Cutoff day for current month (for discount)|
| DAYS_IN_PERIOD_2ND   | CHAR      | 51    | 2      |      | Discount Due day or # days in period    |
| DAYS_DUE_2ND         | CHAR      | 53    | 3      |      | Number of days for 2nd discount period  |
| AP2_UNUSED_1         | CHAR      | 56    | 45     |      | Unused Space                            |
| PRCNT_DISC_ALLOWED   | NUMBER    | N/A   | N/A    | 14.3 | Percentage Discount Allowed             |
| PERCENTAGE_2ND       | NUMBER    | N/A   | N/A    | 14.3 | 2nd Percentage Discount Allowed       |

**Keys:**
*   Primary Key: `TERMS_CODE`

### Table: AP3_VendCatg

| Field Name      | Data Type | Start | Length | Dec | Description          |
| :-------------- | :-------- | :---- | :----- | :-- | :------------------- |
| VEND_CATEGORY   | CHAR      | 1     | 9      |     | Vendor category code |
| CATEGORY_DESC   | CHAR      | 10    | 30     |     | Category description |

**Keys:**
*   Primary Key: `VEND_CATEGORY`

### Table: AP4_Vend

| Field Name             | Data Type | Start | Length | Dec  | Description                                       |
| :--------------------- | :-------- | :---- | :----- | :--- | :------------------------------------------------ |
| VEND_DIV               | CHAR      | 1     | 2      |      | Vendor Division                                   |
| VEND_CODE              | CHAR      | 3     | 8      |      | Vendor Code                                       |
| VEND_NAME              | CHAR      | 11    | 35     |      | Vendor Name                                       |
| VEND_ADDR_1            | CHAR      | 46    | 30     |      | Address Line 1                                    |
| VEND_ADDR_2            | CHAR      | 76    | 30     |      | Address Line 2                                    |
| VEND_CITY              | CHAR      | 106   | 16     |      | City                                              |
| VEND_ST                | CHAR      | 122   | 2      |      | State Code                                        |
| VEND_ZIP               | CHAR      | 124   | 9      |      | Zip Code                                          |
| VEND_FAX               | CHAR      | 133   | 12     |      | Fax number                                        |
| VEND_LOOKUP            | CHAR      | 145   | 10     |      | Lookup Sequence                                   |
| VEND_CONT_PERSON       | CHAR      | 155   | 20     |      | Contact Person                                    |
| VEND_GREETING          | CHAR      | 175   | 20     |      | Greeting                                          |
| VEND_PHONE             | CHAR      | 195   | 14     |      | Phone Number                                      |
| INTERCOMPANY_GL_ACCT   | CHAR      | 209   | 12     |      | Intercompany G/L Account                          |
| FILE_OUTPUT_FORMAT     | CHAR      | 221   | 2      |      | File output format                                |
| SPC                    | CHAR      | 223   | 8      |      | (Unclear purpose, potentially special code)       |
| PRINT_PO               | CHAR      | 231   | 1      |      | (Y/N) Print Purchase Order?                       |
| CARTON_LABELS          | CHAR      | 232   | 1      |      | (Y/N) Print Carton Labels?                        |
| DIRECT_SHIP            | CHAR      | 233   | 1      |      | (Y/N) Direct Ship Vendor?                         |
| SHIP_TO_WHSE           | CHAR      | 234   | 1      |      | (Y/N) Default Ship to Warehouse?                  |
| COMM_SUB_CODE          | CHAR      | 235   | 1      |      | Commission Sub Code                               |
| VEND_RATING            | CHAR      | 236   | 6      |      | Vendor rating (format xxx.xx, max 100.00)         |
| VEND_MWDB              | CHAR      | 242   | 1      |      | Vendor minority/woman/disabled? (e.g., M/W/D/N)   |
| VEND_GREEN             | CHAR      | 243   | 1      |      | (Y/N) Vendor green?                               |
| AP4_UNUSED_1           | CHAR      | 244   | 2      |      | Unused                                            |
| VEND_STAT              | CHAR      | 246   | 1      |      | Vendor Status (e.g., A=Active, I=Inactive)        |
| VEND_CATEGORY          | CHAR      | 247   | 9      |      | Vendor Category (FK to AP3_VendCatg)              |
| STND_INV_COMMENT       | CHAR      | 256   | 15     |      | Standard comment field for invoices               |
| GL_ACCT                | CHAR      | 271   | 12     |      | Standard G/L account                              |
| BANK_CODE              | CHAR      | 283   | 3      |      | Standard bank code                                |
| TERMS_CODE             | CHAR      | 286   | 2      |      | Standard terms code (FK to AP2_Term)              |
| PYMNT_SELECTION_CODE   | CHAR      | 288   | 2      |      | Standard payment selection code                   |
| PYMNT_PRIORITY_CODE    | CHAR      | 290   | 1      |      | Payment Priority code                             |
| VEND_ON_HOLD           | CHAR      | 291   | 1      |      | (Y/N) Vendor on hold?                             |
| SUBCONTRACTOR          | CHAR      | 292   | 1      |      | (Y/N) Subcontractor?                              |
| ALWAYS_TAKE_DISC       | CHAR      | 293   | 1      |      | (Y/N) Always take past due discount               |
| EXC_SPCL_AMT_IN_DISC   | CHAR      | 294   | 6      |      | Exclude special amounts from discount calculation |
| MAILING_LABEL_TYPE_1   | CHAR      | 300   | 3      |      | Mailing Label Types #1                            |
| MAILING_LABEL_TYPE_2   | CHAR      | 303   | 3      |      | Mailing Label Types #2                            |
| MAILING_LABEL_TYPE_3   | CHAR      | 306   | 3      |      | Mailing Label Types #3                            |
| OUR_ACCT_NUM           | CHAR      | 309   | 15     |      | Our account number (with vendor)                  |
| WEB_ADDRESS            | CHAR      | 324   | 40     |      | Web address                                       |
| DEF_DAYS               | CHAR      | 364   | 3      |      | Default Days (purpose unclear)                    |
| JOB_CARD_OVERRIDE      | CHAR      | 367   | 15     |      | Electronic Forms Purchase Order Job Card Override |
| OPTIONS                | CHAR      | 382   | 20     |      | Options                                           |
| CUST_PO_TP             | CHAR      | 402   | 1      |      | (Unclear purpose)                                 |
| CONT_LIST_CODE         | CHAR      | 403   | 4      |      | Contact List Code                                 |
| CONT_CONT_CODE         | CHAR      | 407   | 6      |      | Contact Control Code                              |
| EC_PRINT_FLAGS         | CHAR      | 413   | 5      |      | EC Order Print Flags                              |
| EC_WHSE_CODE           | CHAR      | 418   | 4      |      | EC Warehouse Code                                 |
| XML_ITEM_SPECS         | CHAR      | 422   | 1      |      | (Y/N) Item Specs Enabled in Vendor XML            |
| XML_SPECIAL_SHIP       | CHAR      | 423   | 1      |      | (Y/N) Special Shipping Enabled in Vendor XML      |
| VEND_COUNTRY           | CHAR      | 424   | 2      |      | Vendor Country Code                               |
| AP4_UNUSED_2           | CHAR      | 426   | 1      |      | Unused                                            |
| STND_AMT               | NUMBER    | N/A   | N/A    | 14.3 | Standard Amount                                   |
| EXTRA_DUE_DAYS         | NUMBER    | N/A   | N/A    | 14.3 | Number of Extra Days until Due                    |

**Keys:**
*   Primary Key: `VEND_DIV`, `VEND_CODE`
*   Alternate Key 1: `VEND_PHONE`, `VEND_DIV`, `VEND_CODE`
*   Alternate Key 2: `VEND_LOOKUP`, `VEND_DIV`, `VEND_CODE`
*   Alternate Key 3: `VEND_CATEGORY`, `VEND_DIV`, `VEND_CODE`
*   Alternate Key 4: `VEND_ZIP`, `VEND_DIV`, `VEND_CODE`

### Table: AP5_VendStatus

| Field Name             | Data Type | Start | Length | Dec  | Description                     |
| :--------------------- | :-------- | :---- | :----- | :--- | :-------------------------------|
| VEND_DIV               | CHAR      | 1     | 2      |      | Vendor Division                 |
| VEND_CODE              | CHAR      | 3     | 8      |      | Vendor Code                     |
| LAST_INV_DATE          | DATE      | 11    | 6      |      | Last invoice date               |
| LAST_CHECK_DATE        | DATE      | 17    | 6      |      | Last check date                 |
| ID_1099                | CHAR      | 23    | 14     |      | 1099 ID number                  |
| TYPE_1099              | CHAR      | 37    | 1      |      | 1099 type code                  |
| AP5_UNUSED_1           | CHAR      | 38    | 1      |      | Unused                          |
| CURR_BAL               | NUMBER    | N/A   | N/A    | 14.3 | Current balance due vendor      |
| RETAINAGE_DUE_VEND     | NUMBER    | N/A   | N/A    | 14.3 | Retainage due vendor            |
| PYMNT_CURR_1099_YR     | NUMBER    | N/A   | N/A    | 14.3 | Payments - current 1099 year    |
| CHK_CNT_CURR_1099_YR   | NUMBER    | N/A   | N/A    | 14.3 | Num. of checks - current 1099 year|
| PYMNT_NEXT_1099_YR     | NUMBER    | N/A   | N/A    | 14.3 | Payments - next 1099 year       |
| CHK_CNT_NEXT_1099_YR   | NUMBER    | N/A   | N/A    | 14.3 | Num. of checks - next 1099 year |

**Keys:**
*   Primary Key: `VEND_DIV`, `VEND_CODE`

### Table: AP8_VendMsg

| Field Name             | Data Type | Start | Length | Dec | Description                           |
| :--------------------- | :-------- | :---- | :----- | :-- | :------------------------------------ |
| VEND_DIV               | CHAR      | 1     | 2      |     | Vendor Division                       |
| VEND_CODE              | CHAR      | 3     | 8      |     | Vendor Code                           |
| VEND_INV_MESS_1         | CHAR      | 11    | 60     |     | Invoice entry message line 1          |
| VEND_INV_MESS_2         | CHAR      | 71    | 60     |     | Invoice entry message line 2          |
| VEND_MAN_CHK_MESS_1     | CHAR      | 131   | 60     |     | Manual check entry message line 1     |
| VEND_MAN_CHK_MESS_2     | CHAR      | 191   | 60     |     | Manual check entry message line 2     |
| VEND_OE_MESS_1          | CHAR      | 251   | 60     |     | Order Entry Message Line 1            |
| VEND_OE_MESS_2          | CHAR      | 311   | 60     |     | Order Entry Message Line 2            |
| VEND_INQ_MESS_1         | CHAR      | 371   | 60     |     | Vendor Setup/Inquiry Message Line 1   |
| VEND_INQ_MESS_2         | CHAR      | 431   | 60     |     | Vendor Setup/Inquiry Message Line 2   |

**Keys:**
*   Primary Key: `VEND_DIV`, `VEND_CODE`

### Table: AP9_VendStats

| Field Name    | Data Type | Start | Length | Dec  | Description                     |
| :------------ | :-------- | :---- | :----- | :--- | :-------------------------------|
| VEND_DIV      | CHAR      | 1     | 2      |      | Vendor Division                 |
| VEND_CODE     | CHAR      | 3     | 8      |      | Vendor Code                     |
| FY            | CHAR      | 11    | 4      |      | Fiscal year                     |
| STAT_CODE     | CHAR      | 15    | 1      |      | "Balance type (P,A,I,sp1-4)"    |
| OPEN_BAL      | NUMBER    | N/A   | N/A    | 14.3 | Opening balance                 |
| ACCTPD_BAL_1  | NUMBER    | N/A   | N/A    | 14.3 | Period 1 Balance                |
| ACCTPD_BAL_2  | NUMBER    | N/A   | N/A    | 14.3 | Period 2 Balance                |
| ACCTPD_BAL_3  | NUMBER    | N/A   | N/A    | 14.3 | Period 3 Balance                |
| ACCTPD_BAL_4  | NUMBER    | N/A   | N/A    | 14.3 | Period 4 Balance                |
| ACCTPD_BAL_5  | NUMBER    | N/A   | N/A    | 14.3 | Period 5 Balance                |
| ACCTPD_BAL_6  | NUMBER    | N/A   | N/A    | 14.3 | Period 6 Balance                |
| ACCTPD_BAL_7  | NUMBER    | N/A   | N/A    | 14.3 | Period 7 Balance                |
| ACCTPD_BAL_8  | NUMBER    | N/A   | N/A    | 14.3 | Period 8 Balance                |
| ACCTPD_BAL_9  | NUMBER    | N/A   | N/A    | 14.3 | Period 9 Balance                |
| ACCTPD_BAL_10 | NUMBER    | N/A   | N/A    | 14.3 | Period 10 Balance               |
| ACCTPD_BAL_11 | NUMBER    | N/A   | N/A    | 14.3 | Period 11 Balance               |
| ACCTPD_BAL_12 | NUMBER    | N/A   | N/A    | 14.3 | Period 12 Balance               |
| ACCTPD_BAL_13 | NUMBER    | N/A   | N/A    | 14.3 | Period 13 Balance               |

**Keys:**
*   Primary Key: `VEND_DIV`, `VEND_CODE`, `FY`, `STAT_CODE`

### Table: APA_InvoiceEntManChk

| Field Name             | Data Type | Start | Length | Dec  | Description                                |
| :--------------------- | :-------- | :---- | :----- | :--- | :----------------------------------------- |
| F_Y                    | CHAR      | 1     | 4      |      | Fiscal Year                                |
| ACCNT_PD               | CHAR      | 5     | 2      |      | Accounting Period                          |
| VEND_DIV               | CHAR      | 7     | 2      |      | A/P Vendor Code                            |
| VEND_CODE              | CHAR      | 9     | 8      |      | Vendor Code                                |
| INV_NUM                | CHAR      | 17    | 10     |      | Invoice Number                             |
| INV_DATE               | DATE      | 27    | 6      |      | Invoice Date                               |
| TERM_CODE              | CHAR      | 33    | 2      |      | Terms Code                                 |
| INV_DUE_DATE           | DATE      | 35    | 6      |      | Invoice Due Date                           |
| DISC_EXP_ON            | DATE      | 41    | 6      |      | Discount Expires on                        |
| INV_COMMENT            | CHAR      | 47    | 15     |      | Invoice Comment                            |
| OUR_REF_NUM            | CHAR      | 62    | 10     |      | Our Reference Number                       |
| PRINT_CHCK_BANK_CODE   | CHAR      | 72    | 3      |      | Print Check on Bank Code                   |
| GL_CATG_CODE           | CHAR      | 75    | 9      |      | G/L Category Code                          |
| PAYMT_SEL_CODE         | CHAR      | 84    | 2      |      | Payment Selection Code                     |
| PAYMT_PRI_CODE         | CHAR      | 86    | 1      |      | Payment Priority Code                      |
| PLACE_INV_ON_HOLD      | CHAR      | 87    | 1      |      | Place Invoice on hold?                     |
| SPECIAL_INV_TYPE       | CHAR      | 88    | 1      |      | Special Invoice Type (Sub, PO)             |
| INVOICE_TYPE           | CHAR      | 89    | 1      |      | Invoice Type (A=Adj, R=Ret)                |
| APPLY_TO_INV_NUM       | CHAR      | 90    | 10     |      | Apply to invoice number                    |
| SLS_CODE               | CHAR      | 100   | 4      |      | Salesperson code (parameterized)           |
| SOURCE_COMPANY         | CHAR      | 104   | 3      |      | Source company code                        |
| REMOTE_TYPE            | CHAR      | 107   | 1      |      | Source company code remote location type   |
| ALT_CURRENCY           | CHAR      | 108   | 3      |      | Alternate currency code                    |
| DISC_EXPIRES_2ND       | DATE      | 111   | 6      |      | 2nd discount expires on                    |
| APA_UNUSED_1           | CHAR      | 117   | 30     |      | Unused                                     |
| LINK_TO_DET_FILE       | NUMBER    | N/A   | N/A    | 14.3 | Link into Detail file APU                  |
| GROSS_INV_AMT          | NUMBER    | N/A   | N/A    | 14.3 | Gross Invoice Amount                       |
| SPEC_AMT_1             | NUMBER    | N/A   | N/A    | 14.3 | Special Amount 1                           |
| SPEC_AMT_2             | NUMBER    | N/A   | N/A    | 14.3 | Special Amount 2                           |
| SPEC_AMT_3             | NUMBER    | N/A   | N/A    | 14.3 | Special Amount 3                           |
| SPEC_AMT_4             | NUMBER    | N/A   | N/A    | 14.3 | Special Amount 4                           |
| DISC_APPLIES_TO        | NUMBER    | N/A   | N/A    | 14.3 | Discount Applies to                        |
| DISC_AMT               | NUMBER    | N/A   | N/A    | 14.3 | Discount Amount                            |
| WORKMAN_COMP_WH        | NUMBER    | N/A   | N/A    | 14.3 | Workman's Comp Ins. W/H                   |
| NET_INV_AMT            | NUMBER    | N/A   | N/A    | 14.3 | Net Invoice Amount                         |
| DAYS_TO_EXT_DUE_DATE   | NUMBER    | N/A   | N/A    | 14.3 | Days to Extend Due Date                    |
| USED_INV_ENTRY         | NUMBER    | N/A   | N/A    | 14.3 | Used during Invoice Entry                  |
| AMT_ALT_CURRENCY       | NUMBER    | N/A   | N/A    | 14.3 | Gross amount in alternate currency         |
| DISC_ALT_CURR          | NUMBER    | N/A   | N/A    | 14.3 | Discount amount in alternate currency      |
| DISC_AMT_2ND           | NUMBER    | N/A   | N/A    | 14.3 | 2nd Discount Amount                        |

**Keys:**
*   Primary Key: `F_Y`, `ACCNT_PD`, `VEND_DIV`, `VEND_CODE`, `INV_NUM`

### Table: APB_VendUserDef

| Field Name   | Data Type | Start | Length | Dec | Description                |
| :----------- | :-------- | :---- | :----- | :-- | :------------------------- |
| VEND_DIV     | CHAR      | 1     | 2      |     | Vendor Division            |
| VEND_CODE    | CHAR      | 3     | 8      |     | Vendor Code                |
| FIELD_NUM    | CHAR      | 11    | 4      |     | Field number               |
| FIELD_DATA   | CHAR      | 15    | 75     |     | Field data (variable length)|
| APB_UNUSED_1 | CHAR      | 90    | 36     |     | Unused                     |

**Keys:**
*   Primary Key: `VEND_DIV`, `VEND_CODE`, `FIELD_NUM`

### Table: APC_ChkReg

| Field Name   | Data Type | Start | Length | Dec  | Description      |
| :----------- | :-------- | :---- | :----- | :--- | :--------------- |
| SRC_COMP_CODE| CHAR      | 1     | 3      |      | Source company   |
| BANK_CODE    | CHAR      | 4     | 3      |      | Bank code        |
| VEND_DIV     | CHAR      | 7     | 2      |      | Vendor code      |
| VEND_CODE    | CHAR      | 9     | 8      |      |                  |
| CHECK_CODE   | CHAR      | 17    | 1      |      | Check code       |
| CHECK_NUM    | CHAR      | 18    | 6      |      | Check number     |
| CHECK_DATE   | DATE      | 24    | 6      |      | Check date       |
| REF_NUM      | CHAR      | 30    | 9      |      |                  |
| APC_UNUSED_1 | CHAR      | 39    | 20     |      |                  |
| GROSS_AMT    | NUMBER    | N/A   | N/A    | 14.3 | Gross amount     |
| DISC_TAKEN   | NUMBER    | N/A   | N/A    | 14.3 | Discount taken   |
| NET_SALE     | NUMBER    | N/A   | N/A    | 14.3 | Net check amount |

**Keys:**
*   Primary Key: `SRC_COMP_CODE`, `BANK_CODE`, `VEND_DIV`, `VEND_CODE`, `CHECK_CODE`, `CHECK_NUM`

### Table: APD_InvoiceEntHdr

| Field Name           | Data Type | Start | Length | Dec  | Description                           |
| :------------------- | :-------- | :---- | :----- | :--- | :------------------------------------ |
| FY                   | CHAR      | 1     | 4      |      | Fiscal year                            |
| ACCTPD               | CHAR      | 5     | 2      |      | Acctg period                           |
| VEND_DIV             | CHAR      | 7     | 2      |      | A/P Vendor Division                    |
| VEND_CODE            | CHAR      | 9     | 8      |      | A/P Vendor Code                        |
| INV_NUM              | CHAR      | 17    | 10     |      | Invoice number                        |
| INV_DATE             | DATE      | 27    | 6      |      | Invoice date                           |
| TERMS_CODE           | CHAR      | 33    | 2      |      | Terms Code                             |
| INV_DUE_DATE         | DATE      | 35    | 6      |      | Invoice due date                       |
| DISC_EXPIRE_DATE     | DATE      | 41    | 6      |      | Discount expires                       |
| INV_COMMENT          | CHAR      | 47    | 15     |      | Invoice comment                        |
| OUR_REF_NUM          | CHAR      | 62    | 10     |      | Our reference number                   |
| PRNT_CHK_ON_BANK     | CHAR      | 72    | 3      |      | Print check on bank                    |
| CATEGORY             | CHAR      | 75    | 9      |      | Category code                          |
| PYMNT_SELECTION      | CHAR      | 84    | 2      |      | Pmt selection                          |
| PYMNT_PRIORITY_CODE  | CHAR      | 86    | 1      |      | Pmt priority                           |
| INV_ON_HOLD          | CHAR      | 87    | 1      |      | Place invoice on hold?                  |
| SPECIAL_INV_TYPE     | CHAR      | 88    | 1      |      | Special invoice type (Sub, PO)         |
| INV_TYPE             | CHAR      | 89    | 1      |      | Invoice type (A=Adj, R=Ret)            |
| APPLY_TO_INV_NUM     | CHAR      | 90    | 10     |      | Applies to invoice number              |
| SPER_CODE            | CHAR      | 100   | 4      |      | Salesperson code (parameterized)       |
| SOURCE_COMPANY       | CHAR      | 104   | 3      |      | Source company code                    |
| SRC_LOC_TYPE         | CHAR      | 107   | 1      |      | Source location type (1=RL)            |
| ALT_CURRENCY         | CHAR      | 108   | 3      |      | Alternate currency code                |
| DISC_EXPIRES_2ND     | DATE      | 111   | 6      |      | 2nd discount expires on                |
| APD_UNUSED_1         | CHAR      | 117   | 30     |      | Unused                                  |
| APE_LINK             | NUMBER    | N/A   | N/A    | 14.3 | Index to transaction #1                |
| GROSS_INV_AMT        | NUMBER    | N/A   | N/A    | 14.3 | Gross invoice amount                   |
| SPECIAL_AMT_1        | NUMBER    | N/A   | N/A    | 14.3 | Special amount 1                        |
| SPECIAL_AMT_2        | NUMBER    | N/A   | N/A    | 14.3 | Special amount 2                        |
| SPECIAL_AMT_3        | NUMBER    | N/A   | N/A    | 14.3 | Special amount 3                        |
| SPECIAL_AMT_4        | NUMBER    | N/A   | N/A    | 14.3 | Special amount 4                        |
| DISC_APPLIES_TO      | NUMBER    | N/A   | N/A    | 14.3 | Discount applies to                     |
| DISC_AMT             | NUMBER    | N/A   | N/A    | 14.3 | Discount amount                         |
| WORKMAN_COMP_WH      | NUMBER    | N/A   | N/A    | 14.3 | Workman's comp W/H                      |
| NET_SALE             | NUMBER    | N/A   | N/A    | 14.3 | Net invoice amount                      |
| DAYS_TO_EXTEND_DUE   | NUMBER    | N/A   | N/A    | 14.3 | Days to extend due date                 |
| INTERNAL_USE         | NUMBER    | N/A   | N/A    | 14.3 | Internal use (used during invoice entry) |
| ALT_CURR_GROSS_AMT   | NUMBER    | N/A   | N/A    | 14.3 | Gross amount in alternate currency      |
| ALT_CURR_DISC_AMT    | NUMBER    | N/A   | N/A    | 14.3 | Discount amount in alternate currency   |
| DISC_AMT_2ND         | NUMBER    | N/A   | N/A    | 14.3 | 2nd discount amount                     |
| APD_UNUSED_2         | NUMBER    | N/A   | N/A    | 14.3 | Unused                                  |
| APD_UNUSED_3         | NUMBER    | N/A   | N/A    | 14.3 | Unused                                  |
| APD_UNUSED_4         | NUMBER    | N/A   | N/A    | 14.3 | Unused                                  |
| APD_UNUSED_5         | NUMBER    | N/A   | N/A    | 14.3 | Unused                                  |
| APD_UNUSED_6         | NUMBER    | N/A   | N/A    | 14.3 | Unused                                  |
| APD_UNUSED_7         | NUMBER    | N/A   | N/A    | 14.3 | Unused                                  |
| APD_UNUSED_8         | NUMBER    | N/A   | N/A    | 14.3 | Unused                                  |

**Keys:**
*   Primary Key: `FY`, `ACCTPD`, `VEND_DIV`, `VEND_CODE`, `INV_NUM`
*   Alternate Key 1: `VEND_DIV`, `VEND_CODE`, `INV_NUM`
*   Alternate Key 2: `INV_NUM`
*   Alternate Key 3: `OUR_REF_NUM`

### Table: APG_PaymentSel
{{ ... APG_PaymentSel header ... }}
| VEND_DIV             | CHAR      | 7     | 2      |      | Vendor Division                       |
| VEND_CODE            | CHAR      | 9     | 8      |      | Vendor Code                           |
{{ ... rest of APG_PaymentSel fields ... }}
| Field Name           | Data Type | Start | Length | Dec  | Description                           |
| :------------------- | :-------- | :---- | :----- | :--- | :------------------------------------ |
| VEND_DIV             | CHAR      | 1     | 2      |      | Vendor Division                       |
| VEND_CODE            | CHAR      | 3     | 8      |      | Vendor Code                           |
| INV_NUM              | CHAR      | 11    | 10     |      | Invoice number                        |
| BANK_CODE            | CHAR      | 21    | 3      |      | Bank account                          |
| ALT_CURR_CODE        | CHAR      | 24    | 3      |      | Alternate currency code               |
| USING_2ND_DISC       | CHAR      | 27    | 1      |      | Using 2nd discount date/amount?       |
| APG_UNUSED_1         | CHAR      | 28    | 35     |      | Unused                                |
| GROSS_AMT            | NUMBER    | N/A   | N/A    | 14.3 | Gross amount to pay                   |
| DISC_AMT             | NUMBER    | N/A   | N/A    | 14.3 | Discount amount                       |
| ALT_CURR_GROSS_AMT   | NUMBER    | N/A   | N/A    | 14.3 | Gross Amount in Alternate Currency    |
| ALT_CURR_DISC_AMT    | NUMBER    | N/A   | N/A    | 14.3 | Discount Amount in Alternate Currency |
| APG_UNUSED_2         | NUMBER    | N/A   | N/A    | 14.3 | Unused                                |
| APG_UNUSED_3         | NUMBER    | N/A   | N/A    | 14.3 | Unused                                |

**Keys:**
*   Primary Key: `VEND_DIV`, `VEND_CODE`, `INV_NUM`

### Table: API_OpenInvoice

| Field Name             | Data Type | Start | Length | Dec  | Description                             |
| :--------------------- | :-------- | :---- | :----- | :--- | :-------------------------------------- |
| VEND_DIV               | CHAR      | 1     | 2      |      | Vendor Division                         |
| VEND_CODE              | CHAR      | 3     | 8      |      | Vendor Code                             |
| INV_NUM                | CHAR      | 11    | 10     |      | Invoice                                 |
| INV_DATE               | DATE      | 21    | 6      |      | Invoice Date                            |
| TERMS_CODE             | CHAR      | 27    | 2      |      | Terms Code                              |
| INV_DUE_DATE           | DATE      | 29    | 6      |      | Invoice Due Date                        |
| DISC_EXPIRE_DATE       | DATE      | 35    | 6      |      | Discount Expires                        |
| INV_COMMENT            | CHAR      | 41    | 15     |      | Invoice Comment                         |
| OUR_REF_NUM            | CHAR      | 56    | 10     |      | Our Reference No                        |
| PRINT_ON_BANK_CODE     | CHAR      | 66    | 3      |      | Print on Bank                           |
| CATEGORY               | CHAR      | 69    | 9      |      | Category Code                           |
| PYMNT_SELECTION        | CHAR      | 78    | 2      |      | Pmt Selection                           |
| PYMNT_PRIORITY_CODE    | CHAR      | 80    | 1      |      | Pmt Priority                            |
| INV_ON_HOLD            | CHAR      | 81    | 1      |      | Place Invoice on hold?                   |
| INV_SPECIAL_CODE       | CHAR      | 82    | 1      |      | Inv Special Code                        |
| INV_TYPE               | CHAR      | 83    | 1      |      | Invoice Type                            |
| APPLY_TO_INV_NUM       | CHAR      | 84    | 10     |      | Applies to Invoice number               |
| ORIG_UPDT_IN_FYAP      | CHAR      | 94    | 6      |      | Originally updated in FY/Period         |
| GREATEST_FY            | CHAR      | 100   | 4      |      | Highest Period/Year updated to          |
| GREATEST_ACCTPD        | CHAR      | 104   | 2      |      | (Highest Accounting Period updated to)   |
| AUDIT_NUM              | CHAR      | 106   | 6      |      | Audit control number                    |
| API_UNUSED_1           | CHAR      | 112   | 2      |      | Unknown                                |
| SPER_CODE              | CHAR      | 114   | 4      |      | Salesperson code                        |
| ORIG_COMP_CODE         | CHAR      | 118   | 3      |      | Original company code                   |
| SRC_LOC_TYPE           | CHAR      | 121   | 1      |      | Source location type (1=RL)             |
| ALT_CURR_CODE          | CHAR      | 122   | 3      |      | Alternate Currency Code                 |
| DISC_EXPIRES_2ND       | DATE      | 125   | 6      |      | 2nd discount expires on                 |
| API_UNUSED_8           | CHAR      | 131   | 30     |      | Unused                                  |
| TRANS_DETAIL_LINK      | NUMBER    | N/A   | N/A    | 14.3 | Index to transaction #1                 |
| GL_DETAIL_LINK         | NUMBER    | N/A   | N/A    | 14.3 | Index to G/L Distribution               |
| TOTAL_BOOKED_TO_AP     | NUMBER    | N/A   | N/A    | 14.3 | Total Booked to A/P                     |
| SPECIAL_INV_AMT_1      | NUMBER    | N/A   | N/A    | 14.3 | Special Invoice Amount 1                |
| SPECIAL_INV_AMT_2      | NUMBER    | N/A   | N/A    | 14.3 | Special Invoice Amount 2                |
| SPECIAL_INV_AMT_3      | NUMBER    | N/A   | N/A    | 14.3 | Special Invoice Amount 3                |
| SPECIAL_INV_AMT_4      | NUMBER    | N/A   | N/A    | 14.3 | Special Invoice Amount 4                |
| ORIG_DISC_AVAIL        | NUMBER    | N/A   | N/A    | 14.3 | Original Discount Available             |
| WC_INS_WH              | NUMBER    | N/A   | N/A    | 14.3 | Worker's Comp Ins. W/H                  |
| EXTEND_DUE_DT          | NUMBER    | N/A   | N/A    | 14.3 | Extend Due Date                         |
| ORIG_INV_AMT           | NUMBER    | N/A   | N/A    | 14.3 | Original Invoice Amount                 |
| DISC_TAKEN_TO_DT       | NUMBER    | N/A   | N/A    | 14.3 | Discounts Taken to Date                 |
| PYMNTS_APPLIED_TO_DT   | NUMBER    | N/A   | N/A    | 14.3 | Payments Applied to Date                |
| BAL_DUE_ON_INVOICE     | NUMBER    | N/A   | N/A    | 14.3 | Balance due on this Invoice             |
| POSTED_TO_DT_SPEC_1    | NUMBER    | N/A   | N/A    | 14.3 | Posted to date - Special Amount 1       |
| POSTED_TO_DT_SPEC_2    | NUMBER    | N/A   | N/A    | 14.3 | Posted to date - Special Amount 2       |
| POSTED_TO_DT_SPEC_3    | NUMBER    | N/A   | N/A    | 14.3 | Posted to date - Special Amount 3       |
| POSTED_TO_DT_SPEC_4    | NUMBER    | N/A   | N/A    | 14.3 | Posted to date - Special Amount 4       |
| GROSS_AMT_ALT_CURR     | NUMBER    | N/A   | N/A    | 14.3 | Gross Amount in Alternate Currency      |
| DISC_AMT_ALT_CURR      | NUMBER    | N/A   | N/A    | 14.3 | Discount Amount in Alternate Currency   |
| ALT_GROSS_AMT_ALT_C    | NUMBER    | N/A   | N/A    | 14.3 | Alternate Gross Amount paid to date     |
| ALT_DISC_AMT_PTD       | NUMBER    | N/A   | N/A    | 14.3 | Alternate Discount Amount paid to date  |
| DISC_AVAIL_2ND         | NUMBER    | N/A   | N/A    | 14.3 | Original Discount Available 2           |
| API_UNUSED_2           | NUMBER    | N/A   | N/A    | 14.3 | Unused                                  |
| API_UNUSED_3           | NUMBER    | N/A   | N/A    | 14.3 | Unused                                  |
| API_UNUSED_4           | NUMBER    | N/A   | N/A    | 14.3 | Unused                                  |
| API_UNUSED_5           | NUMBER    | N/A   | N/A    | 14.3 | Unused                                  |
| API_UNUSED_6           | NUMBER    | N/A   | N/A    | 14.3 | Unused                                  |
| API_UNUSED_7           | NUMBER    | N/A   | N/A    | 14.3 | Unused                                  |

**Keys:**
*   Primary Key: `VEND_DIV`, `VEND_CODE`, `INV_NUM`
*   Alternate Key 1: `PRINT_ON_BANK_CODE`, `VEND_DIV`, `VEND_CODE`, `INV_NUM`

### Table: APH_ChkPrn

| Field Name           | Data Type | Start | Length | Dec  | Description                               |
| :------------------- | :-------- | :---- | :----- | :--- | :---------------------------------------- |
| SRC_COMP_CODE        | CHAR      | 1     | 3      |      | Source company code                       |
| BANK_CODE            | CHAR      | 4     | 3      |      | Bank account code                         |
| VEND_DIV             | CHAR      | 7     | 2      |      | Vendor Division                           |
| VEND_CODE            | CHAR      | 9     | 8      |      | Vendor Code                               |
| SPECIAL_CHECK_CODE   | CHAR      | 17    | 1      |      | Special check code                        |
| INV_NUM              | CHAR      | 18    | 10     |      | Invoice number                            |
| CHECK_NUM            | CHAR      | 28    | 6      |      | Check number                              |
| ALT_C_C              | CHAR      | 34    | 3      |      | Alternate Currency Code                   |
| CHECK_DATE           | CHAR      | 37    | 6      |      | Check Date                                |
| GROSS_INV_PYMNT      | NUMBER    | N/A   | N/A    | 14.3 | Gross Invoice Payment                     |
| DISC_TAKEN           | NUMBER    | N/A   | N/A    | 14.3 | Discount Taken                            |
| GROSS_INV_PYMNT_ALTC | NUMBER    | N/A   | N/A    | 14.3 | Gross Invoice Payment in Alternate Currency |
| DISC_TAKEN_IN_ALTC   | NUMBER    | N/A   | N/A    | 14.3 | Discount Taken in Alternate Currency      |
| APH_UNUSED_2         | NUMBER    | N/A   | N/A    | 14.3 | Unused                                    |
| APH_UNUSED_3         | NUMBER    | N/A   | N/A    | 14.3 | Unused                                    |

**Keys:**
*   Primary Key: `SRC_COMP_CODE`, `BANK_CODE`, `VEND_DIV`, `VEND_CODE`, `SPECIAL_CHECK_CODE`, `INV_NUM`

### Table: APJ_InvoiceTrans

| Field Name   | Data Type | Start | Length | Dec  | Description               |
| :----------- | :-------- | :---- | :----- | :--- | :------------------------ |
| VEND_DIV     | CHAR      | 1     | 2      |      | Vendor Division           |
| VEND_CODE    | CHAR      | 3     | 8      |      | Vendor Code               |
| INV_NUM      | CHAR      | 11    | 10     |      | Invoice Number            |
| TF_REF       | CHAR      | 21    | 15     |      | Transfer Reference        |
| TRANS_TYPE   | CHAR      | 36    | 1      |      | Transaction Type          |
| FY           | CHAR      | 37    | 4      |      | Fiscal Year               |
| ACCTPD       | CHAR      | 41    | 2      |      | Accounting Period         |
| AUDIT_NUM    | CHAR      | 43    | 6      |      | Audit Number              |
| TRANS_DATE   | DATE      | 49    | 6      |      | Transaction Date          |
| SEQ_NO       | CHAR      | 55    | 3      |      | Sequence Number           |
| REC_STATUS   | CHAR      | 58    | 1      |      | Record Status             |
| CLEAR_FY     | CHAR      | 59    | 4      |      | Clearing Fiscal Year      |
| CLEAR_ACCTPD | CHAR      | 63    | 2      |      | Clearing Accounting Period|
| APJ_UNUSED_1 | CHAR      | 65    | 16     |      | Unused                    |
| TRANS_AMT    | NUMBER    | N/A   | N/A    | 14.3 | Transaction Amount        |

**Keys:**
*   Primary Key: `VEND_DIV`, `VEND_CODE`, `INV_NUM`, `TRANS_TYPE`, `TRANS_DATE`, `SEQ_NO`

### Table: APL_InvoiceEntLns

| Field Name     | Data Type | Start | Length | Dec  | Description          |
| :------------- | :-------- | :---- | :----- | :--- | :------------------- |
| FY             | CHAR      | 1     | 4      |      | Fiscal Year          |
| ACCTPD         | CHAR      | 5     | 2      |      | Accounting Period    |
| VEND_DIV       | CHAR      | 7     | 2      |      | A/P Vendor Division  |
| VEND_CODE      | CHAR      | 9     | 8      |      | A/P Vendor Code      |
| INV_NUM        | CHAR      | 17    | 10     |      | Invoice Number       |
| LINE_NUM       | CHAR      | 27    | 3      |      | Line Number          |
| TRANS_DATE     | DATE      | 30    | 6      |      | Transaction Date     |
| GL_ACCT        | CHAR      | 36    | 12     |      | G/L Account Number   |
| JOB_NUM        | CHAR      | 48    | 9      |      | Job Number           |
| JC_COST_CODE   | CHAR      | 57    | 9      |      | J/C Cost Code        |
| COST_CODE_TYPE | CHAR      | 66    | 1      |      | Cost Code Type       |
| TF_MEMO        | CHAR      | 67    | 45     |      | Memo Field           |
| APL_UNUSED_1   | CHAR      | 112   | 39     |      | Unused               |
| HOURS          | NUMBER    | N/A   | N/A    | 14.3 | Hours                |
| UNITS          | NUMBER    | N/A   | N/A    | 14.3 | Units                |
| RATE           | NUMBER    | N/A   | N/A    | 14.3 | Rate                 |
| AMT            | NUMBER    | N/A   | N/A    | 14.3 | Amount               |

**Keys:**
*   Primary Key: `FY`, `ACCTPD`, `VEND_DIV`, `VEND_CODE`, `INV_NUM`, `LINE_NUM`

### Table: APM_MoDisbHdr

| Field Name     | Data Type | Start | Length | Dec  | Description                |
| :------------- | :-------- | :---- | :----- | :--- | :------------------------- |
| FY             | CHAR      | 1     | 4      |      | Fiscal year                |
| ACCTPD         | CHAR      | 5     | 2      |      | Acctg period               |
| BANK_CODE      | CHAR      | 7     | 3      |      | Bank code                  |
| CHECK_NUM      | CHAR      | 10    | 6      |      | Check number               |
| SEQ_NUM        | CHAR      | 16    | 2      |      | Sequence counter           |
| CHECK_TYPE     | CHAR      | 18    | 1      |      | Check type                 |
| CHECK_DATE     | DATE      | 19    | 6      |      | Check date                 |
| VEND_DIV       | CHAR      | 25    | 2      |      | Vendor Division            |
| VEND_CODE      | CHAR      | 27    | 8      |      | Vendor Code                |
| PAYEE_NAME     | CHAR      | 35    | 35     |      | Payee name                 |
| AUDIT_NUM      | CHAR      | 70    | 6      |      | Audit number               |
| FILE_REF_NUM   | CHAR      | 76    | 9      |      | File Reference Number      |
| CLEAR_FY       | CHAR      | 85    | 4      |      | Clearing Fiscal Year       |
| CLEAR_ACCTPD   | CHAR      | 89    | 2      |      | Clearing Accounting Period |
| APM_UNUSED_1   | CHAR      | 91    | 20     |      | Unused                     |
| GROSS_AMT      | NUMBER    | N/A   | N/A    | 14.3 | Gross amount               |
| DISC_AMT       | NUMBER    | N/A   | N/A    | 14.3 | Discount Amount            |
| NET_SALE       | NUMBER    | N/A   | N/A    | 14.3 | Net sale (Net Amount Paid) |

**Keys:**
*   Primary Key: `FY`, `ACCTPD`, `BANK_CODE`, `CHECK_NUM`, `SEQ_NUM`
*   Alternate Key 1: `BANK_CODE`, `CHECK_NUM`, `FY`, `ACCTPD`
*   Alternate Key 2: `CHECK_NUM`, `VEND_DIV`, `VEND_CODE`, `FY`, `ACCTPD`, `BANK_CODE`, `SEQ_NUM`

### Table: APN_MoDisbDet

| Field Name     | Data Type | Start | Length | Dec  | Description      |
| :------------- | :-------- | :---- | :----- | :--- | :--------------- |
| FY             | CHAR      | 1     | 4      |      | FY/Acctg Period  |
| ACCTPD         | CHAR      | 5     | 2      |      | (Acctg Period)   |
| BANK_CODE      | CHAR      | 7     | 3      |      | Bank code        |
| CHECK_NUM      | CHAR      | 10    | 6      |      | Check number     |
| SEQ_NUM        | CHAR      | 16    | 2      |      | Sequence counter |
| INV_NUM        | CHAR      | 18    | 10     |      | Invoice number   |
| INV_DATE       | DATE      | 28    | 6      |      | Invoice date     |
| GL_CATG_CODE   | CHAR      | 34    | 9      |      | G/L category     |
| APN_UNUSED_1   | CHAR      | 43    | 1      |      | Unused           |
| GL_DETAIL_LINK | NUMBER    | N/A   | N/A    | 14.3 | Index to G/L     |
| GROSS_AMT      | NUMBER    | N/A   | N/A    | 14.3 | Gross Amount     |
| DISC_AMT       | NUMBER    | N/A   | N/A    | 14.3 | Discount Amount  |
| SPECIAL_AMT_1  | NUMBER    | N/A   | N/A    | 14.3 | Special Amount 1 |
| SPECIAL_AMT_2  | NUMBER    | N/A   | N/A    | 14.3 | Special Amount 2 |
| SPECIAL_AMT_3  | NUMBER    | N/A   | N/A    | 14.3 | Special Amount 3 |
| SPECIAL_AMT_4  | NUMBER    | N/A   | N/A    | 14.3 | Special Amount 4 |
| NET_AMOUNT     | NUMBER    | N/A   | N/A    | 14.3 | Net Amount       |

**Keys:**
*   Primary Key: `FY`, `ACCTPD`, `BANK_CODE`, `CHECK_NUM`, `SEQ_NUM`, `INV_NUM`

### Table: APQ_InvoiceHis

| Field Name             | Data Type | Start | Length | Dec  | Description                          |
| :--------------------- | :-------- | :---- | :----- | :--- | :----------------------------------- |
| VEND_DIV               | CHAR      | 1     | 2      |      | Vendor Division                      |
| VEND_CODE              | CHAR      | 3     | 8      |      | Vendor Code                          |
| INV_NUM                | CHAR      | 11    | 10     |      | Invoice                              |
| INV_DATE               | DATE      | 21    | 6      |      | Invoice Date                         |
| TERMS_CODE             | CHAR      | 27    | 2      |      | Terms Code                           |
| INV_DUE_DATE           | DATE      | 29    | 6      |      | Invoice Due Date                     |
| DISC_EXPIRE_DATE       | DATE      | 35    | 6      |      | Discount Expires                     |
| INV_COMMENT            | CHAR      | 41    | 15     |      | Invoice Comment                      |
| OUR_REF_NUM            | CHAR      | 56    | 10     |      | Our Reference No                     |
| PRINT_ON_BANK_CODE     | CHAR      | 66    | 3      |      | Print on Bank                        |
| CATEGORY               | CHAR      | 69    | 9      |      | Category Code                        |
| PYMNT_SELECTION        | CHAR      | 78    | 2      |      | Pmt Selection                        |
| PYMNT_PRIORITY_CODE    | CHAR      | 80    | 1      |      | Pmt Priority                         |
| INV_ON_HOLD            | CHAR      | 81    | 1      |      | Place Invoice on hold?                |
| INV_SPECIAL_CODE       | CHAR      | 82    | 1      |      | Inv Special Code                     |
| INV_TYPE               | CHAR      | 83    | 1      |      | Invoice Type                         |
| APPLY_TO_INV_NUM       | CHAR      | 84    | 10     |      | Applies to Invoice number            |
| ORIG_UPDT_IN_FYAP      | CHAR      | 94    | 6      |      | Originally updated in FY/Period      |
| GREATEST_FY            | CHAR      | 100   | 4      |      | Highest Period/Year updated to       |
| GREATEST_ACCTPD        | CHAR      | 104   | 2      |      | (Highest Accounting Period updated to)|
| AUDIT_NUM              | CHAR      | 106   | 6      |      | Audit control number                 |
| APQ_UNUSED_1           | CHAR      | 112   | 2      |      | Unknown                              |
| SPER_CODE              | CHAR      | 114   | 4      |      | Salesperson code                     |
| ORIG_COMP_CODE         | CHAR      | 118   | 3      |      | Original company code                |
| SRC_LOC_TYPE           | CHAR      | 121   | 1      |      | Source location type (1=RL)          |
| ALT_CURR_CODE          | CHAR      | 122   | 3      |      | Alternate Currency Code              |
| DISC_EXPIRES_2ND       | DATE      | 125   | 6      |      | 2nd discount expires on              |
| APQ_UNUSED_2           | CHAR      | 131   | 30     |      | Unused                               |
| TRANS_DETAIL_LINK      | NUMBER    | N/A   | N/A    | 14.3 | Index to transaction #1              |
| GL_DETAIL_LINK         | NUMBER    | N/A   | N/A    | 14.3 | Index to G/L Distribution            |
| TOTAL_BOOKED_TO_AP     | NUMBER    | N/A   | N/A    | 14.3 | Total Booked to A/P                  |
| SPECIAL_INV_AMT_1      | NUMBER    | N/A   | N/A    | 14.3 | Special Invoice Amount 1             |
| SPECIAL_INV_AMT_2      | NUMBER    | N/A   | N/A    | 14.3 | Special Invoice Amount 2             |
| SPECIAL_INV_AMT_3      | NUMBER    | N/A   | N/A    | 14.3 | Special Invoice Amount 3             |
| SPECIAL_INV_AMT_4      | NUMBER    | N/A   | N/A    | 14.3 | Special Invoice Amount 4             |
| ORIG_DISC_AVAIL        | NUMBER    | N/A   | N/A    | 14.3 | Original Discount Available          |
| WC_INS_WH              | NUMBER    | N/A   | N/A    | 14.3 | Worker's Comp Ins. W/H               |
| EXTEND_DUE_DT          | NUMBER    | N/A   | N/A    | 14.3 | Extend Due Date                      |
| ORIG_INV_AMT           | NUMBER    | N/A   | N/A    | 14.3 | Original Invoice Amount              |
| DISC_TAKEN_TO_DT       | NUMBER    | N/A   | N/A    | 14.3 | Discounts Taken to Date              |
| PYMNTS_APPLIED_TO_DT   | NUMBER    | N/A   | N/A    | 14.3 | Payments Applied to Date             |
| BAL_DUE_ON_INVOICE     | NUMBER    | N/A   | N/A    | 14.3 | Balance due on this Invoice          |
| POSTED_TO_DT_SPEC_1    | NUMBER    | N/A   | N/A    | 14.3 | Posted to date - Special Amount 1    |
| POSTED_TO_DT_SPEC_2    | NUMBER    | N/A   | N/A    | 14.3 | Posted to date - Special Amount 2    |
| POSTED_TO_DT_SPEC_3    | NUMBER    | N/A   | N/A    | 14.3 | Posted to date - Special Amount 3    |
| POSTED_TO_DT_SPEC_4    | NUMBER    | N/A   | N/A    | 14.3 | Posted to date - Special Amount 4    |
| GROSS_AMT_ALT_CURR     | NUMBER    | N/A   | N/A    | 14.3 | Gross Amount in Alternate Currency   |
| DISC_AMT_ALT_CURR      | NUMBER    | N/A   | N/A    | 14.3 | Discount Amount in Alternate Currency|
| ALT_GROSS_AMT_PTD      | NUMBER    | N/A   | N/A    | 14.3 | Alternate Gross Amount paid to date  |
| ALT_DISC_AMT_PTD       | NUMBER    | N/A   | N/A    | 14.3 | Alternate Discount Amount paid to date|
| DISC_AVAIL_2ND         | NUMBER    | N/A   | N/A    | 14.3 | Original Discount Available 2        |
| APQ_UNUSED_3           | NUMBER    | N/A   | N/A    | 14.3 | Unused                               |
| APQ_UNUSED_4           | NUMBER    | N/A   | N/A    | 14.3 | Unused                               |
| APQ_UNUSED_5           | NUMBER    | N/A   | N/A    | 14.3 | Unused                               |
| APQ_UNUSED_6           | NUMBER    | N/A   | N/A    | 14.3 | Unused                               |
| APQ_UNUSED_7           | NUMBER    | N/A   | N/A    | 14.3 | Unused                               |

**Keys:**
*   Primary Key: `VEND_DIV`, `VEND_CODE`, `INV_NUM`
*   Alternate Key 1: `PRINT_ON_BANK_CODE`, `VEND_DIV`, `VEND_CODE`, `INV_NUM`

### Table: API_OpenInvoice

| Field Name             | Data Type | Start | Length | Dec  | Description                             |
| :--------------------- | :-------- | :---- | :----- | :--- | :-------------------------------------- |
| VEND_DIV               | CHAR      | 1     | 2      |      | Vendor Division                         |
| VEND_CODE              | CHAR      | 3     | 8      |      | Vendor Code                             |
| INV_NUM                | CHAR      | 11    | 10     |      | Invoice                                 |
| INV_DATE               | DATE      | 21    | 6      |      | Invoice Date                            |
| TERMS_CODE             | CHAR      | 27    | 2      |      | Terms Code                              |
| INV_DUE_DATE           | DATE      | 29    | 6      |      | Invoice Due Date                        |
| DISC_EXPIRE_DATE       | DATE      | 35    | 6      |      | Discount Expires                        |
| INV_COMMENT            | CHAR      | 41    | 15     |      | Invoice Comment                         |
| OUR_REF_NUM            | CHAR      | 56    | 10     |      | Our Reference No                        |
| PRINT_ON_BANK_CODE     | CHAR      | 66    | 3      |      | Print on Bank                           |
| CATEGORY               | CHAR      | 69    | 9      |      | Category Code                           |
| PYMNT_SELECTION        | CHAR      | 78    | 2      |      | Pmt Selection                           |
| PYMNT_PRIORITY_CODE    | CHAR      | 80    | 1      |      | Pmt Priority                            |
| INV_ON_HOLD            | CHAR      | 81    | 1      |      | Place Invoice on hold?                   |
| INV_SPECIAL_CODE       | CHAR      | 82    | 1      |      | Inv Special Code                        |
| INV_TYPE               | CHAR      | 83    | 1      |      | Invoice Type                            |
| APPLY_TO_INV_NUM       | CHAR      | 84    | 10     |      | Applies to Invoice number               |
| ORIG_UPDT_IN_FYAP      | CHAR      | 94    | 6      |      | Originally updated in FY/Period         |
| GREATEST_FY            | CHAR      | 100   | 4      |      | Highest Period/Year updated to          |
| GREATEST_ACCTPD        | CHAR      | 104   | 2      |      | (Highest Accounting Period updated to)   |
| AUDIT_NUM              | CHAR      | 106   | 6      |      | Audit control number                    |
| API_UNUSED_1           | CHAR      | 112   | 2      |      | Unknown                                |
| SPER_CODE              | CHAR      | 114   | 4      |      | Salesperson code                        |
| ORIG_COMP_CODE         | CHAR      | 118   | 3      |      | Original company code                   |
| SRC_LOC_TYPE           | CHAR      | 121   | 1      |      | Source location type (1=RL)             |
| ALT_CURR_CODE          | CHAR      | 122   | 3      |      | Alternate Currency Code                 |
| DISC_EXPIRES_2ND       | DATE      | 125   | 6      |      | 2nd discount expires on                 |
| API_UNUSED_8           | CHAR      | 131   | 30     |      | Unused                                  |
| TRANS_DETAIL_LINK      | NUMBER    | N/A   | N/A    | 14.3 | Index to transaction #1                 |
| GL_DETAIL_LINK         | NUMBER    | N/A   | N/A    | 14.3 | Index to G/L Distribution               |
| TOTAL_BOOKED_TO_AP     | NUMBER    | N/A   | N/A    | 14.3 | Total Booked to A/P                     |
| SPECIAL_INV_AMT_1      | NUMBER    | N/A   | N/A    | 14.3 | Special Invoice Amount 1                |
| SPECIAL_INV_AMT_2      | NUMBER    | N/A   | N/A    | 14.3 | Special Invoice Amount 2                |
| SPECIAL_INV_AMT_3      | NUMBER    | N/A   | N/A    | 14.3 | Special Invoice Amount 3                |
| SPECIAL_INV_AMT_4      | NUMBER    | N/A   | N/A    | 14.3 | Special Invoice Amount 4                |
| ORIG_DISC_AVAIL        | NUMBER    | N/A   | N/A    | 14.3 | Original Discount Available             |
| WC_INS_WH              | NUMBER    | N/A   | N/A    | 14.3 | Worker's Comp Ins. W/H                  |
| EXTEND_DUE_DT          | NUMBER    | N/A   | N/A    | 14.3 | Extend Due Date                         |
| ORIG_INV_AMT           | NUMBER    | N/A   | N/A    | 14.3 | Original Invoice Amount                 |
| DISC_TAKEN_TO_DT       | NUMBER    | N/A   | N/A    | 14.3 | Discounts Taken to Date                 |
| PYMNTS_APPLIED_TO_DT   | NUMBER    | N/A   | N/A    | 14.3 | Payments Applied to Date                |
| BAL_DUE_ON_INVOICE     | NUMBER    | N/A   | N/A    | 14.3 | Balance due on this Invoice             |
| POSTED_TO_DT_SPEC_1    | NUMBER    | N/A   | N/A    | 14.3 | Posted to date - Special Amount 1       |
| POSTED_TO_DT_SPEC_2    | NUMBER    | N/A   | N/A    | 14.3 | Posted to date - Special Amount 2       |
| POSTED_TO_DT_SPEC_3    | NUMBER    | N/A   | N/A    | 14.3 | Posted to date - Special Amount 3       |
| POSTED_TO_DT_SPEC_4    | NUMBER    | N/A   | N/A    | 14.3 | Posted to date - Special Amount 4       |
| GROSS_AMT_ALT_CURR     | NUMBER    | N/A   | N/A    | 14.3 | Gross Amount in Alternate Currency      |
| DISC_AMT_ALT_CURR      | NUMBER    | N/A   | N/A    | 14.3 | Discount Amount in Alternate Currency   |
| ALT_GROSS_AMT_ALT_C    | NUMBER    | N/A   | N/A    | 14.3 | Alternate Gross Amount paid to date     |
| ALT_DISC_AMT_PTD       | NUMBER    | N/A   | N/A    | 14.3 | Alternate Discount Amount paid to date  |
| DISC_AVAIL_2ND         | NUMBER    | N/A   | N/A    | 14.3 | Original Discount Available 2           |
| API_UNUSED_2           | NUMBER    | N/A   | N/A    | 14.3 | Unused                                  |
| API_UNUSED_3           | NUMBER    | N/A   | N/A    | 14.3 | Unused                                  |
| API_UNUSED_4           | NUMBER    | N/A   | N/A    | 14.3 | Unused                                  |
| API_UNUSED_5           | NUMBER    | N/A   | N/A    | 14.3 | Unused                                  |
| API_UNUSED_6           | NUMBER    | N/A   | N/A    | 14.3 | Unused                                  |
| API_UNUSED_7           | NUMBER    | N/A   | N/A    | 14.3 | Unused                                  |

**Keys:**
*   Primary Key: `VEND_DIV`, `VEND_CODE`, `INV_NUM`
*   Alternate Key 1: `PRINT_ON_BANK_CODE`, `VEND_DIV`, `VEND_CODE`, `INV_NUM`

### Table: API_OpenInvoice

| Field Name             | Data Type | Start | Length | Dec  | Description                             |
| :--------------------- | :-------- | :---- | :----- | :--- | :-------------------------------------- |
| VEND_DIV               | CHAR      | 1     | 2      |      | Vendor Division                         |
| VEND_CODE              | CHAR      | 3     | 8      |      | Vendor Code                             |
| INV_NUM                | CHAR      | 11    | 10     |      | Invoice                                 |
| INV_DATE               | DATE      | 21    | 6      |      | Invoice Date                            |
| TERMS_CODE             | CHAR      | 27    | 2      |      | Terms Code                              |
| INV_DUE_DATE           | DATE      | 29    | 6      |      | Invoice Due Date                        |
| DISC_EXPIRE_DATE       | DATE      | 35    | 6      |      | Discount Expires                        |
| INV_COMMENT            | CHAR      | 41    | 15     |      | Invoice Comment                         |
| OUR_REF_NUM            | CHAR      | 56    | 10     |      | Our Reference No                        |
| PRINT_ON_BANK_CODE     | CHAR      | 66    | 3      |      | Print on Bank                           |
| CATEGORY               | CHAR      | 69    | 9      |      | Category Code                           |
| PYMNT_SELECTION        | CHAR      | 78    | 2      |      | Pmt Selection                           |
| PYMNT_PRIORITY_CODE    | CHAR      | 80    | 1      |      | Pmt Priority                            |
| INV_ON_HOLD            | CHAR      | 81    | 1      |      | Place Invoice on hold?                   |
| INV_SPECIAL_CODE       | CHAR      | 82    | 1      |      | Inv Special Code                        |
| INV_TYPE               | CHAR      | 83    | 1      |      | Invoice Type                            |
| APPLY_TO_INV_NUM       | CHAR      | 84    | 10     |      | Applies to Invoice number               |
| ORIG_UPDT_IN_FYAP      | CHAR      | 94    | 6      |      | Originally updated in FY/Period         |
| GREATEST_FY            | CHAR      | 100   | 4      |      | Highest Period/Year updated to          |
| GREATEST_ACCTPD        | CHAR      | 104   | 2      |      | (Highest Accounting Period updated to)   |
| AUDIT_NUM              | CHAR      | 106   | 6      |      | Audit control number                    |
| API_UNUSED_1           | CHAR      | 112   | 2      |      | Unknown                                |
| SPER_CODE              | CHAR      | 114   | 4      |      | Salesperson code                        |
| ORIG_COMP_CODE         | CHAR      | 118   | 3      |      | Original company code                   |
| SRC_LOC_TYPE           | CHAR      | 121   | 1      |      | Source location type (1=RL)             |
| ALT_CURR_CODE          | CHAR      | 122   | 3      |      | Alternate Currency Code                 |
| DISC_EXPIRES_2ND       | DATE      | 125   | 6      |      | 2nd discount expires on                 |
| API_UNUSED_8           | CHAR      | 131   | 30     |      | Unused                                  |
| TRANS_DETAIL_LINK      | NUMBER    | N/A   | N/A    | 14.3 | Index to transaction #1                 |
| GL_DETAIL_LINK         | NUMBER    | N/A   | N/A    | 14.3 | Index to G/L Distribution               |
| TOTAL_BOOKED_TO_AP     | NUMBER    | N/A   | N/A    | 14.3 | Total Booked to A/P                     |
| SPECIAL_INV_AMT_1      | NUMBER    | N/A   | N/A    | 14.3 | Special Invoice Amount 1                |
| SPECIAL_INV_AMT_2      | NUMBER    | N/A   | N/A    | 14.3 | Special Invoice Amount 2                |
| SPECIAL_INV_AMT_3      | NUMBER    | N/A   | N/A    | 14.3 | Special Invoice Amount 3                |
| SPECIAL_INV_AMT_4      | NUMBER    | N/A   | N/A    | 14.3 | Special Invoice Amount 4                |
| ORIG_DISC_AVAIL        | NUMBER    | N/A   | N/A    | 14.3 | Original Discount Available             |
| WC_INS_WH              | NUMBER    | N/A   | N/A    | 14.3 | Worker's Comp Ins. W/H                  |
| EXTEND_DUE_DT          | NUMBER    | N/A   | N/A    | 14.3 | Extend Due Date                         |
| ORIG_INV_AMT           | NUMBER    | N/A   | N/A    | 14.3 | Original Invoice Amount                 |
| DISC_TAKEN_TO_DT       | NUMBER    | N/A   | N/A    | 14.3 | Discounts Taken to Date                 |
| PYMNTS_APPLIED_TO_DT   | NUMBER    | N/A   | N/A    | 14.3 | Payments Applied to Date                |
| BAL_DUE_ON_INVOICE     | NUMBER    | N/A   | N/A    | 14.3 | Balance due on this Invoice             |
| POSTED_TO_DT_SPEC_1    | NUMBER    | N/A   | N/A    | 14.3 | Posted to date - Special Amount 1       |
| POSTED_TO_DT_SPEC_2    | NUMBER    | N/A   | N/A    | 14.3 | Posted to date - Special Amount 2       |
| POSTED_TO_DT_SPEC_3    | NUMBER    | N/A   | N/A    | 14.3 | Posted to date - Special Amount 3       |
| POSTED_TO_DT_SPEC_4    | NUMBER    | N/A   | N/A    | 14.3 | Posted to date - Special Amount 4       |
| GROSS_AMT_ALT_CURR     | NUMBER    | N/A   | N/A    | 14.3 | Gross Amount in Alternate Currency      |
| DISC_AMT_ALT_CURR      | NUMBER    | N/A   | N/A    | 14.3 | Discount Amount in Alternate Currency   |
| ALT_GROSS_AMT_ALT_C    | NUMBER    | N/A   | N/A    | 14.3 | Alternate Gross Amount paid to date     |
| ALT_DISC_AMT_PTD       | NUMBER    | N/A   | N/A    | 14.3 | Alternate Discount Amount paid to date  |
| DISC_AVAIL_2ND         | NUMBER    | N/A   | N/A    | 14.3 | Original Discount Available 2           |
| API_UNUSED_2           | NUMBER    | N/A   | N/A    | 14.3 | Unused                                  |
| API_UNUSED_3           | NUMBER    | N/A   | N/A    | 14.3 | Unused                                  |
| API_UNUSED_4           | NUMBER    | N/A   | N/A    | 14.3 | Unused                                  |
| API_UNUSED_5           | NUMBER    | N/A   | N/A    | 14.3 | Unused                                  |
| API_UNUSED_6           | NUMBER    | N/A   | N/A    | 14.3 | Unused                                  |
| API_UNUSED_7           | NUMBER    | N/A   | N/A    | 14.3 | Unused                                  |

**Keys:**
*   Primary Key: `VEND_DIV`, `VEND_CODE`, `INV_NUM`
*   Alternate Key 1: `PRINT_ON_BANK_CODE`, `VEND_DIV`, `VEND_CODE`, `INV_NUM`
