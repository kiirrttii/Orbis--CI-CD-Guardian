# ML model artifacts directory
#
# Place your trained model file here:
#   model.pkl
#
# The model must:
#   - be serialised with joblib (joblib.dump)
#   - expose sklearn-compatible predict() and predict_proba() methods
#   - accept a 2D array of shape (n, 10) with features in this order:
#       LOC, CYCLO, LENGTH, VOLUME, DIFFICULTY,
#       INT_FAN_IN, INT_FAN_OUT, NUM_OPERATORS, NUM_OPERANDS, BRANCH_COUNT
#
# To generate a synthetic model for local development/testing, run:
#   python scripts/generate_test_model.py
#
# IMPORTANT: Do NOT commit real model weights to version control.
# Add *.pkl to .gitignore.
