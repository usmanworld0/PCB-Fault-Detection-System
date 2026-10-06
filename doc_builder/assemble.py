# -*- coding: utf-8 -*-
"""Assembles all sections into FYP_VIVA_MASTER_DOCUMENT.md."""

import os
from doc_builder.sec01_05_overview import CONTENT as SEC01_05
from doc_builder.sec06_09_stack_arch import CONTENT as SEC06_09
from doc_builder.sec10_13_platforms import CONTENT as SEC10_13
from doc_builder.sec14_17_auth_api import CONTENT as SEC14_17
from doc_builder.sec18_20_api_matrices import CONTENT as SEC18_20
from doc_builder.sec21_24_db_storage_cv import CONTENT as SEC21_24
from doc_builder.sec25_28_ai_models_defects import CONTENT as SEC25_28
from doc_builder.sec29_34_code_structure import CONTENT as SEC29_34
from doc_builder.sec35_45_ops_tradeoffs import CONTENT as SEC35_45
from doc_builder.sec46_50_viva_qna import CONTENT as SEC46_50
from doc_builder.sec51_57_viva_code_cheat import CONTENT as SEC51_57

def assemble():
    modules = [
        SEC01_05,
        SEC06_09,
        SEC10_13,
        SEC14_17,
        SEC18_20,
        SEC21_24,
        SEC25_28,
        SEC29_34,
        SEC35_45,
        SEC46_50,
        SEC51_57
    ]
    
    full_doc = "\n\n---\n\n".join(modules)
    
    output_path = os.path.join(os.path.dirname(__file__), "..", "FYP_VIVA_MASTER_DOCUMENT.md")
    output_path = os.path.abspath(output_path)
    
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(full_doc)
        
    print(f"Successfully assembled {output_path}")
    print(f"Total file size: {os.path.getsize(output_path)} bytes")

if __name__ == "__main__":
    assemble()
