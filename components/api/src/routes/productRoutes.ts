import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/', async (req, res) => {
  const { q, category } = req.query; 

  try {
    const baseArgs = {
      where: {
        OR: q
          ? [
              { name: { contains: q as string, mode: 'insensitive' } },
              { description: { contains: q as string, mode: 'insensitive' } },
            ]
          : undefined,
        category: category
          ? {
              slug: category as string,
            }
          : undefined,
      },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    };

    // Feature-detect includes across Guepard branches.
    // If the generated Prisma client doesn't have a relation, Prisma will throw.
    const candidates: any[] = [
      { ...baseArgs, include: { ...baseArgs.include, variants: true, images: { orderBy: { order: 'asc' } } } },
      { ...baseArgs, include: { ...baseArgs.include, variants: true } },
      { ...baseArgs, include: { ...baseArgs.include, images: { orderBy: { order: 'asc' } } } },
      baseArgs,
    ];

    let products: any[] | undefined;
    let lastError: any;
    for (const args of candidates) {
      try {
        products = await (prisma.product as any).findMany(args);
        break;
      } catch (e) {
        lastError = e;
      }
    }
    if (!products) throw lastError;

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const baseArgs = {
      where: { id },
      include: { category: true },
    };

    const candidates: any[] = [
      { ...baseArgs, include: { ...baseArgs.include, variants: true, images: { orderBy: { order: 'asc' } } } },
      { ...baseArgs, include: { ...baseArgs.include, variants: true } },
      { ...baseArgs, include: { ...baseArgs.include, images: { orderBy: { order: 'asc' } } } },
      baseArgs,
    ];

    let product: any | null = null;
    let lastError: any;
    for (const args of candidates) {
      try {
        product = await (prisma.product as any).findUnique(args);
        break;
      } catch (e) {
        lastError = e;
      }
    }
    if (product === null && lastError) throw lastError;

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, description, price, stock, imageUrl, categoryId } = req.body;
    const newProduct = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
        imageUrl,
        categoryId: categoryId,
      },
    });
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { name, description, price, stock, imageUrl, categoryId } = req.body;
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
        imageUrl,
        categoryId: categoryId,
      },
    });
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.product.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;