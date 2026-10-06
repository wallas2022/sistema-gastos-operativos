from .classifier import DocumentClassifier
from .field_extractor import FieldExtractor
from .models import IntelligenceResult
from .segmenter import DocumentSegmenter
from .templates import TemplateResolver
from .validator import RuleValidator


class DocumentIntelligenceEngine:
    def __init__(self, classifier=None, segmenter=None, resolver=None, extractor=None, validator=None):
        self.classifier = classifier or DocumentClassifier()
        self.segmenter = segmenter or DocumentSegmenter()
        self.resolver = resolver or TemplateResolver()
        self.extractor = extractor or FieldExtractor()
        self.validator = validator or RuleValidator()

    def interpret(self, raw_text, optical_confidence):
        classification = self.classifier.classify(raw_text)
        blocks = self.segmenter.segment(raw_text)
        template = self.resolver.resolve(classification)
        fields, items, totals = self.extractor.extract(blocks, template, optical_confidence or 0.0)
        success, status, messages, confidence = self.validator.validate(fields, items, totals, optical_confidence or 0.0)
        return IntelligenceResult(success, status, confidence, classification, template.id, fields, items, totals, messages)
