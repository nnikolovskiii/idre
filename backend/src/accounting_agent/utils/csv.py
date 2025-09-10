import pandas as pd


def print_csv_columns(csv_file_path):
    """
    Read a CSV file and print values from specific columns.

    Args:
        csv_file_path (str): Path to the CSV file
    """
    try:
        # Read the CSV file
        df = pd.read_csv(csv_file_path)

        # Define the columns we want to print
        columns_to_print = ["Пол", "Етничка група", "Депресија ", "Анксиозност "]

        # Check if all required columns exist in the CSV
        missing_columns = [col for col in columns_to_print if col not in df.columns]
        if missing_columns:
            print(f"Warning: The following columns are missing from the CSV: {missing_columns}")
            # Filter to only existing columns
            columns_to_print = [col for col in columns_to_print if col in df.columns]

        if not columns_to_print:
            print("None of the specified columns were found in the CSV file.")
            print(f"Available columns: {list(df.columns)}")
            return

        # Print column headers
        print("=" * 80)
        print("CSV Column Values:")
        print("=" * 80)

        # Print values for each column
        for column in columns_to_print:
            print(f"\n{column}:")
            print("-" * 40)
            values = df[column].tolist()
            for i, value in enumerate(values, 1):
                print(f"Row {i}: {value}")

        print("\n" + "=" * 80)
        print(f"Total rows processed: {len(df)}")

    except FileNotFoundError:
        print(f"Error: File '{csv_file_path}' not found.")
    except pd.errors.EmptyDataError:
        print("Error: The CSV file is empty.")
    except Exception as e:
        print(f"Error reading CSV file: {str(e)}")


# Alternative function that prints in table format
def print_csv_columns_table(csv_file_path):
    """
    Read a CSV file and print values from specific columns in table format.

    Args:
        csv_file_path (str): Path to the CSV file
    """
    try:
        # Read the CSV file
        df = pd.read_csv(csv_file_path)

        # Define the columns we want to print
        columns_to_print = ["Пол", "Етничка група", "Депресија ", "Анксиозност "]

        # Filter to only existing columns
        existing_columns = [col for col in columns_to_print if col in df.columns]

        if not existing_columns:
            print("None of the specified columns were found in the CSV file.")
            print(f"Available columns: {list(df.columns)}")
            return

        # Print only the specified columns
        print("=" * 80)
        print("CSV Data - Selected Columns:")
        print("=" * 80)
        print(df[existing_columns].to_string(index=True))
        print(f"\nTotal rows: {len(df)}")

    except FileNotFoundError:
        print(f"Error: File '{csv_file_path}' not found.")
    except Exception as e:
        print(f"Error reading CSV file: {str(e)}")


# New function for specific analysis
def count_female_albanian_with_conditions(csv_file_path):
    """
    Count how many Женски (female) and Албанец-ка (Albanian) have anxiety or depression as "Да" (yes).

    Args:
        csv_file_path (str): Path to the CSV file
    """
    try:
        # Read the CSV file
        df = pd.read_csv(csv_file_path)

        # Define the columns
        gender_col = "Пол"
        ethnicity_col = "Етничка група"
        depression_col = "Депресија "
        anxiety_col = "Анксиозност "
        profession_col = "Професија"

        # Check if all required columns exist
        required_cols = [gender_col, ethnicity_col, depression_col, anxiety_col]
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            print(f"Error: Missing columns: {missing_cols}")
            return

        # Filter for Женски (female) and Албанец-ка (Albanian)
        base_filter = (df[gender_col] == "Женски") & (df[ethnicity_col] == "Албанец-ка") & (df[profession_col] == "домаќинка")

        # Count those with depression = "Да"
        depression_count = len(df[base_filter & (df[depression_col] == "Да")])

        # Count those with anxiety = "Да"
        anxiety_count = len(df[base_filter & (df[anxiety_col] == "Да")])

        # Count those with EITHER depression OR anxiety = "Да"
        either_condition = len(df[base_filter & ((df[depression_col] == "Да") | (df[anxiety_col] == "Да"))])

        # Count those with BOTH depression AND anxiety = "Да"
        both_conditions = len(df[base_filter & (df[depression_col] == "Да") & (df[anxiety_col] == "Да")])

        # Total count of Женски and Албанец-ка
        total_female_albanian = len(df[base_filter])

        # Print results
        print("=" * 60)
        print("Analysis: Женски (Female) and Албанец-ка (Albanian)")
        print("=" * 60)
        print(f"Total Женски and Албанец-ка: {total_female_albanian}")
        print()
        print("Conditions:")
        print(f"  With Depression (Да): {depression_count}")
        print(f"  With Anxiety (Да): {anxiety_count}")
        print(f"  With Either condition: {either_condition}")
        print(f"  With Both conditions: {both_conditions}")

        if total_female_albanian > 0:
            print()
            print("Percentages:")
            print(f"  Depression rate: {depression_count / total_female_albanian * 100:.1f}%")
            print(f"  Anxiety rate: {anxiety_count / total_female_albanian * 100:.1f}%")
            print(f"  Either condition: {either_condition / total_female_albanian * 100:.1f}%")
            print(f"  Both conditions: {both_conditions / total_female_albanian * 100:.1f}%")

        # Show breakdown by condition
        print("\n" + "=" * 60)
        print("Detailed Breakdown:")
        print("=" * 60)

        if total_female_albanian > 0:
            subset = df[base_filter].copy()
            print("Individual records (Женски + Албанец-ка):")
            print("-" * 40)
            for i, (idx, row) in enumerate(subset.iterrows(), 1):
                dep_status = row[depression_col]
                anx_status = row[anxiety_col]
                print(f"Record {i}: Depression={dep_status}, Anxiety={anx_status}")

    except FileNotFoundError:
        print(f"Error: File '{csv_file_path}' not found.")
    except Exception as e:
        print(f"Error processing CSV file: {str(e)}")


# Example usage
if __name__ == "__main__":
    # Replace 'your_file.csv' with the actual path to your CSV file
    csv_file_path = "/home/nnikolovskii/dev/general-chat/backend/src/accounting_agent/utils/lol.csv"

    # Run the specific analysis
    count_female_albanian_with_conditions(csv_file_path)

    print("\n" + "=" * 80)
    print("Additional methods available:")
    print("=" * 80)
    print("Method 1 - Column by column:")
    print_csv_columns(csv_file_path)

    print("\n\nMethod 2 - Table format:")
    print_csv_columns_table(csv_file_path)