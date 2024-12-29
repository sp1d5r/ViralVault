import express from 'express';
import { getArticleBySlug, getArticles } from '../controllers/articleController';

const router = express.Router();

router.get('/', getArticles);
router.get('/:slug', getArticleBySlug);

export default router;