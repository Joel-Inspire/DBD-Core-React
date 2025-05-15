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

**Numeric/Special Fields (from `A[index]` usage - Mapped by FS2 Data Dictionary):**

- The program utilizes `A[0]` through `A[29]`. These fields hold quantities, prices, costs, dates, flags, etc.
- Examples noted:
  - `A[0]`: Potentially original quantity or an amount.
  - `A[2]`: Related to costing UOM factor.
  - `A[5]`: Related to selling UOM factor.
  - `A[11]`: Set from FMP customer defaults.

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
- `A$(178,10)`: **Pricing Feature Code** (Conditional, linked to Item Group)

**Numeric/Mapped Fields (`A[index]`):**

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
- `A[20]` - `A[39]`: Additional numeric fields, likely supporting more quantity breaks, cost components, or other specific item attributes (e.g., SSP# 273055 expanded cost breaks).

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
  - `I[0]` (e.g., Standard/Base Price) -> `A[4]`
  - `I[14]` (e.g., Cost UOM factor) -> `A[5]`
  - `I[15]` (e.g., List Price or Price UOM factor) -> `A[2]`
  - `I[17]` (e.g., TOPS Cost, conditional use) -> `A[1]`
  - `I[18]` (e.g., Standard Cost) -> `A[1]`
  - `I[19]` (e.g., Item Weight) -> `A[12]`

A comprehensive understanding of all `IC0` fields and their purposes will require analysis of a dedicated Item Master maintenance program or a direct data dictionary dump for `IC0`.

### Deduced Schema: IC1 - Item Balance/Warehouse (Observations from FM2ODB.pxprg)

Analysis of `FM2ODB.pxprg` reveals interactions with `IC1`, likely an Item Balance or Item Warehouse file, which provides crucial data for sales order line items. Here's what has been deduced:

- **Logical File Designator**: `IC1...` (opened into file slot `Z[11]` in `FM2ODB.pxprg`).
- **Record Buffer**: `J$`
- **IOLIST Used**: `0400` (as per `FM2ODB.pxprg` line `1566`).
  - `IOLIST J$,J[0],J[1],J[2],J[3],J[4],J[5],J[6],J[7],J[8]`
- **Structure (from IOLIST and `DIM J[8]` in `FM2ODB.pxprg` line `1030`):
  - String portion: `J$` (length defined by `IC1` data dictionary).
  - Mapped numeric/special fields: `J[0]` through `J[8]` (9 fields defined in the `IC1` data dictionary).
- **Observed Key Structure (in `FM2ODB.pxprg` line `1566`):
  - `KEY = C0$ + A$(19,10) + A$(10,4)`
    - `C0$`: Customer-specific prefix (if applicable).
    - `A$(19,10)`: Item Number (CHAR, 10) from the sales order line.
    - `A$(10,4)`: Item Suffix/Qualifier (CHAR, 4) from the sales order line (could represent warehouse or other attributes).

**Observed Usage in `FM2ODB.pxprg` (lines `1567-1568`):

- Fields `J[3]`, `J[4]`, `J[5]`, `J[6]`, `J[7]`, and `J[8]` are directly used in calculations:
  - `T3` is derived from `J[7]` (e.g., `T3=J[7]*1.15` or `T3=J[7]`), possibly representing a cost or price.
  - `T0` is calculated as `J[3]+J[4]-J[5]+J[6]`, likely representing a net quantity (e.g., On Hand + On Order - Committed - Allocated).
  - Other temporary variables `T1` and `T2` are derived from these.
- These calculated values (`T0`, `T1`, `T2`, `T3`) are presumed to influence the sales order line item details (e.g., availability, pricing, cost), although their direct assignment to `FS2` fields (`A$`) is not immediately visible and might occur in subroutines (like `FM2OB5`) or during screen interaction.
- Fields `J[0]`, `J[1]`, and `J[2]` are not directly referenced in this immediate code block.

A full understanding of `IC1`'s schema (including the `J$` string part and the precise meaning of all `J[n]` fields) and its complete role in populating sales order lines requires further analysis of the `IC1` data dictionary, related subroutines like `FM2OB5.pxprg`, or dedicated `IC1` maintenance programs.

### Phase 2: New Application Design & Technology Stack Definition

**Objective**: To define the architecture, technology stack, and detailed design for the modernized application.

**Activities**:
1.  **Define Minimum Viable Product (MVP)**: Identify a core module or a set of critical functionalities for the initial development phase.
2.  **Finalize Technology Stack**:
    *   **Frontend**: React (based on initial preference).
    *   **Backend**: Choose a primary language/framework (e.g., .NET Core/C#, Node.js/TypeScript, Python/Django/Flask, Java/Spring Boot) suitable for Azure.
    *   **Database**: Select an Azure database solution (e.g., Azure SQL Database, Azure Cosmos DB, Azure Database for PostgreSQL/MySQL) based on data characteristics and application needs.
    *   **API Design**: Define API strategy (e.g., RESTful, GraphQL).
3.  **High-Level Architecture Design**:
    *   Embrace MACH principles (Microservices, API-first, Cloud-native, Headless).
    *   Design microservice boundaries based on legacy modules and future needs.
    *   Plan Azure services to be used (e.g., Azure App Service, Azure Kubernetes Service (AKS), Azure Functions, Azure API Management).
4.  **Database Design**: Create a new relational or NoSQL schema based on the legacy schema, addressing any identified limitations and incorporating modern best practices.
5.  **UI/UX Design**: Plan the user interface and user experience for the new web application, focusing on modern usability standards.

### Phase 3: Data Migration Strategy & Planning

**Objective**: To plan and prepare for the migration of data from the legacy flat-file system to the new database.

**Activities**:
1.  **Develop ETL (Extract, Transform, Load) Processes**: Design and create scripts/tools (e.g., Python, Azure Data Factory) for data extraction, transformation (to fit the new schema and cleanse data), and loading.
2.  **Data Validation Plan**: Define procedures to ensure data integrity and accuracy post-migration.
3.  **Phased Migration Approach (if applicable)**: Determine if data migration will occur in phases or as a single event, aligned with module rollout.

### Phase 4: Development & Implementation (Iterative)

**Objective**: To build and test the new application.

**Activities**:
1.  **Environment Setup**: Configure development, testing, and production environments on Azure.
2.  **MVP Development**: Build the backend services (APIs) and frontend UI for the selected MVP module(s).
3.  **Iterative Development**: Continue developing subsequent modules/features based on the prioritized backlog.
4.  **Testing**: Implement comprehensive testing:
    *   Unit tests for individual components.
    *   Integration tests for service interactions.
    *   End-to-end (E2E) tests for user workflows.
5.  **Continuous Integration/Continuous Deployment (CI/CD)**: Set up CI/CD pipelines for automated builds, testing, and deployments.

### Phase 5: Deployment, Go-Live & Post-Launch

**Objective**: To deploy the application, transition users, and provide ongoing support.

**Activities**:
1.  **Production Deployment**: Deploy the application to the Azure production environment.
2.  **Final Data Migration (if not done incrementally)**.
3.  **User Acceptance Testing (UAT)**: Conduct UAT with business users to validate functionality.
4.  **Training & Documentation**: Provide user training and comprehensive system documentation.
5.  **Go-Live**: Launch the new application.
6.  **Monitoring & Support**: Implement monitoring for performance and errors. Provide post-launch support.
7.  **Ongoing Maintenance & Enhancements**: Plan for future updates, bug fixes, and feature additions.

## 3. Key Considerations

*   **Change Management**: Address the impact of the new system on users and business processes.
*   **Security**: Implement robust security measures at all layers (application, data, infrastructure).
*   **Performance & Scalability**: Design for optimal performance and the ability to scale as needed.
*   **Phased Rollout**: Consider a phased rollout by module or user group to minimize disruption and risk.
